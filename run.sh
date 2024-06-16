#!/usr/bin/env bash
cd client
npm run build

cd ..
cargo run --bin web