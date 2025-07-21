#!/usr/bin/env bash
cd client
npm run build

cd ../server
cargo run --bin web