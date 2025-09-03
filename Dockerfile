FROM rust:bullseye AS build

# RUN USER=root cargo new --bin app
WORKDIR /app

COPY ./server/Cargo.toml ./Cargo.toml
COPY ./server/Cargo.lock ./Cargo.lock
COPY ./server/src ./src

RUN cargo build --release


# Final base
FROM debian:bullseye-slim

RUN apt-get update && apt-get install -y libc-bin ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=build /app/target/release/web . 
COPY ./server/public public
COPY ./server/data/hmac.bin data/hmac.bin

CMD ["./web"]
