# TLDR

After cloning the git repository...

**Linux**:
- (Nix package manager):
    ```sh
    nix-shell # enter a shell with dependencies installed and linked
    ./setup.sh # creates a random HMAC key and environment variables
    ./run.sh # run the web server

- Otherwise, omit ``nix-shell`` and instead install dependencies manually.

**Windows**:
- Run the Docker-Compose dev profile ``docker compose up dev`` to build a docker image and run a container.
- Alternatively, use Windows Subsystem Linux with the Linux instructions.

Dependencies:
- Rust toolkit (rustup, rustc, cargo)
    - Rust dependencies (openssl, pkg-config) if not already installed 
- NodeJS (node, npm)

# Setup

The following are the general objectives required to set up and run this web server. For a platform-specific guide, see below.
Example bash commands (POSIX terminal) which could be used are given as an example. For more details, see the guides.
- Create a file with some random contents (a **HMAC key**). 
    - (Bash) ``$ head 100 /dev/random > hmac.bin``
- Create an admin password hash to be placed in ``.env``
    - (Bash) ``$ echo 'password' | argon2 saltItWithSalt -l 32 -e`` (Warning: saves in bash_history)
- Create a ``.env`` file from the example
    - (Bash) ``$ cp .env.example .env``
    - Configure...
