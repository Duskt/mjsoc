use actix_web::{
    body::EitherBody,
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    Error, HttpResponse,
};
use futures_util::{future::LocalBoxFuture, FutureExt, TryFutureExt};
use serde::{Deserialize, Serialize};
use std::{
    env,
    future::{ready, Ready},
    sync::{Arc, RwLock},
};

use crate::quota::Quota;

#[derive(Debug, Serialize, Deserialize, Clone, Eq, PartialEq)]
struct Notification {
    body: String,
    title: String,

    #[serde(rename = "type")]
    notification_type: String,
}

// There are two steps in middleware processing.
// 1. Middleware initialization, middleware factory gets called with
//    next service in chain as parameter.
// 2. Middleware's call method gets called with normal request.
pub struct RateLimit {
    quota: Arc<RwLock<Quota>>,
}

impl RateLimit {
    pub fn new(quota: Arc<RwLock<Quota>>) -> Self {
        Self { quota }
    }
}

// Middleware factory is `Transform` trait
// `S` - type of the next service
// `B` - type of response's body
impl<S, B> Transform<S, ServiceRequest> for RateLimit
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<EitherBody<B>>;
    type Error = Error;
    type InitError = ();
    type Transform = RateLimitMiddleware<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(RateLimitMiddleware {
            service,
            quota: self.quota.clone(),
        }))
    }
}

pub struct RateLimitMiddleware<S> {
    service: S,
    quota: Arc<RwLock<Quota>>,
}

async fn send_notification(ip: &str, seconds_remaining: i64) {
    let content = Notification {
        title: "Rate limiting mjsoc.hop.io".to_string(),
        body: format!(
            "Quota exceeded, not sending more responses.\n\nOffending IP: {}\n\nWill replenish in {}s",
            ip,
            seconds_remaining
        ),
        notification_type: "note".to_string(),
    };

    let client = reqwest::Client::builder()
        .connection_verbose(true)
        .build()
        .unwrap();

    let pushbullet_access_tokens = env::var("PUSHBULLET_ACCESS_TOKENS");
    if let Ok(tokens) = pushbullet_access_tokens {
        let tokens = tokens.split(',').filter(|t| !t.is_empty());
        for token in tokens {
            client
                .post("https://api.pushbullet.com/v2/pushes")
                .header("Access-Token", token)
                .json(&content)
                .send()
                .await
                .unwrap();
        }
    }
}

impl<S, B> Service<ServiceRequest> for RateLimitMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<EitherBody<B>>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let quota_mtx = self.quota.clone();
        let remaining;

        {
            let mut quota = quota_mtx.write().unwrap();

            quota.replenish();
            remaining = quota.use_one();
        }

        if remaining <= -5 {
            panic!("Too many requests. Not sending response");
        } else if remaining < 0 {
            return Box::pin(async move {
                let seconds_remaining;
                {
                    let read_quota = quota_mtx.read().unwrap();
                    seconds_remaining = read_quota.until_replenish().num_seconds();
                }

                if remaining == -4 {
                    send_notification(
                        &req.peer_addr().unwrap().ip().to_string(),
                        seconds_remaining,
                    )
                    .await;
                }

                Ok(req.into_response(
                    HttpResponse::TooManyRequests()
                        .finish()
                        .map_into_right_body(),
                ))
            });
        }

        self.service
            .call(req)
            .map_ok(ServiceResponse::map_into_left_body)
            .boxed_local()
    }
}
