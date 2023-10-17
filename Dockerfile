FROM rust:bullseye as build

RUN USER=root cargo new --bin app
WORKDIR /app

COPY ./Cargo.toml ./Cargo.toml
COPY ./Cargo.lock ./Cargo.lock

# Cache dependencies 
RUN cargo build --release
RUN rm src/*.rs

COPY ./src ./src

RUN rm ./target/release/deps/mjsoc_attendance*
RUN cargo build --release


# Final base
FROM debian:bullseye-slim

RUN apt-get update && apt-get install -y libc-bin && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/target/release/mjsoc-attendance .
COPY ./public ./public
COPY ./keys ./keys


CMD ["./mjsoc-attendance"]
