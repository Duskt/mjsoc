FROM rust:bullseye AS build

WORKDIR /app

COPY ./server/Cargo.toml ./Cargo.toml
COPY ./server/Cargo.lock ./Cargo.lock
COPY ./server/src ./src

RUN cargo build --release;

# Final base
FROM debian:bullseye-slim

RUN apt-get update && apt-get install -y libc-bin ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app
# dir tree:
# /app
# |_ web (binary executable)
# |_ public/
# |  |_ index.js
# |  |_ ...
COPY --from=build /app/target/release/web .
# public is mounted separately instead
# COPY ./server/public public
# hmac.bin is provided securely during deployment
# COPY ./server/hmac.bin hmac.bin

# mahjong data file
VOLUME /mnt/data
# client static files
VOLUME /mnt/public
CMD ["./web"]
