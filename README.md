A webserver for hosting scored Mahjong games. Used for a society Mahjong tournament (seating players, recording scores, etc.).
- interactive client frontend (``client``)
- sqlite3 persistent storage
- hashed password with cookie sessions
- (not currently used) QR code generation for login
- (not currently used) connected to Google Sheets API

# Setup

Windows isn't supported for this project: your best options are probably
- Docker: see ``Dockerfile`` (if you're familiar with Docker)
- WSL (Builtin VM on Windows): build project in WSL as below. 

## Linux

``./run.sh``
This script will check dependencies are installed, prompt you to configure the server, and then build the client and run the server.

### Dependencies (node, rust)

If you use Nix package manager, you can simply run ``nix-shell`` to install dependencies in an isolated development environment, and then just run ``./run.sh``.
Otherwise, you will need to install dependencies manually for build.

Building this project requires NodeJS and the Rust toolchain (can be installed via `rustup`).
On systems where these are not pre-installed, you will need to install the following to use Rust:
- libssl
- pkg-config

# Architecture

This monorepository contains both the ``server`` and ``client`` projects, which are mostly separated.

## Server 

Written in Rust using actix and a sqlite3 database (see ``server/Cargo.toml``).
The server also contains the CLI for QR code generation (not currently used).

## client/src (Client)

The client is written in TypeScript (without any framework) which is transpiled and bundled into one file using ``esbuild``.
