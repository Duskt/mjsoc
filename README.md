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

## High priority

-   Confirmation of actions
-   Autocomplete member list
-   Add a frontend way to enter points from a table that doesn't exist
-   Rename table no.

## Medium priority

-   Indicate round wind on-screen (and have a table map?)
-   Have an alert pop-up when authorisation runs out.

## Low priority

-   increase font-sizes for tables
-   style the log page
-   refactor the css, particularly for sidebar transitions
-   Allow multiple clients to interact instantaneously:
-       sqlite3 migration
-       unauthorised page

# Bugs

-   new player isn't ordered into scoreboard
-   duplicate tables
