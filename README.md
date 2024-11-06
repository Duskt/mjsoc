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

## Feature

-   make things bigger
-   add success confirmations and errors:
    -   shuffle
    -   fill
    -   add/remove members
-   style the log page
-   allow redo and delete logs with double-auth
-   persist auth keys

## Refactor

-   Clear up event rerenders
-   refactor the css, particularly for sidebar transitions

## Future

-   Rename table no.
-   Allow multiple clients to interact instantaneously:
    -   sqlite3 migration
    -   unauthorised page

## Bugs

-   duplicate tables: on new player, register (should be fixed; see bottom of player.ts in this commit)
