A simple backend with a hashed password and cookie sessions connected to a Google Sheets API.

# Setup

You may have to install libssl-dev and pkg-config (Ubuntu)

```bash
sudo apt install libssl-dev
sudo apt install pkg-config
```

1. Generate a hash for the admin password:

```bash
echo -n "<password>" | argon2 saltItWithSalt -l 32 -e
```

2. Create hmac file with any random characters in (e.g. `hmac.bin`)
3. Create `data/mahjong.json` file:
   FORMAT TBD
4. (Opt.) add logo file in `public/assets/logo.jpg`
5. Configure the `.env` file
6. `./run.sh`

# Architecture

## ./src (Server)

Contains the Rust server and command line interface.

-   cli: Command line interface for QR code generation.
-   lib
-   web

## client/src (Client)

-   components
-   pages

# Todo

## Priority

-   10faan penalty
-   key for chinese characters

## Feature

-   display round wind
-   finish success anim
-   style the log page

## Future

-   Clear up event rerenders
-   Add a frontend way to enter points from a table that doesn't exist
-   Rename table no.
-   increase font-sizes for tables
-   refactor the css, particularly for sidebar transitions
-   Allow multiple clients to interact instantaneously:
    -   sqlite3 migration
    -   unauthorised page

# Bugs

-   duplicate tables
-   premature session reload?
