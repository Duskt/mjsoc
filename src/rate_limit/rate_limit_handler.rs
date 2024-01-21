use crate::notification::send_notification;
use actix_web::{
    body::EitherBody,
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    Error, HttpResponse,
};
use futures_util::{future::LocalBoxFuture, FutureExt, TryFutureExt};
use std::{
    future::{ready, Ready},
    sync::{Arc, RwLock},
};

use super::quota::Quota;

// if limiting, Some(LimitDetails)
// else, None
fn get_limit(quota: Arc<RwLock<Quota>>, num_over_before_drop: i32) -> Option<LimitDetails> {
    let quota_mtx = quota.clone();
    let mut quota = quota_mtx.write().unwrap();

    quota.replenish();
    let remaining = quota.use_one();
    drop(quota);

    if remaining <= -num_over_before_drop {
        panic!("Too many requests. Not sending response");
    } else if remaining < 0 {
        let seconds_remaining;
        {
            let read_quota = quota_mtx.read().unwrap();
            seconds_remaining = read_quota.until_replenish().num_seconds();
        }

        return Some(LimitDetails {
            seconds_remaining,
            about_to_drop: remaining == -num_over_before_drop + 1,
        });
    }

    None
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
        match get_limit(self.quota.clone(), 5) {
            // Continue request as normal
            None => self
                .service
                .call(req)
                .map_ok(ServiceResponse::map_into_left_body)
                .boxed_local(),
            // Rate limit
            Some(details) => {
                println!(
                    "Rate limit hit, need to wait {}s to send another request",
                    details.seconds_remaining
                );

                Box::pin(async move {
                    // If next is a panic, send pushbullet notification now
                    if details.about_to_drop {
                        println!("About to start dropping requests, sending notification");
                        send_notification(
                            &req.peer_addr().unwrap().ip().to_string(),
                            details.seconds_remaining,
                        )
                        .await;
                    }

                    // Empty too many requests response (to reduce bytes out)
                    Ok(req.into_response(
                        HttpResponse::TooManyRequests()
                            .finish()
                            .map_into_right_body(),
                    ))
                })
            }
        }
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

struct LimitDetails {
    seconds_remaining: i64,
    about_to_drop: bool,
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

pub struct RateLimitMiddleware<S> {
    service: S,
    quota: Arc<RwLock<Quota>>,
}
