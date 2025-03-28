FROM rust:bullseye AS build

# RUN USER=root cargo new --bin app
WORKDIR /app

COPY ./Cargo.toml ./Cargo.toml
COPY ./Cargo.lock ./Cargo.lock
COPY ./src ./src

RUN cargo build --release


# Final base
FROM debian:bullseye-slim

RUN apt-get update && apt-get install -y libc-bin ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/target/release/web .
COPY ./public ./public


CMD ["./web"]
