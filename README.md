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

Priority: 1 (urgent) - 5 (not entirely necessary)
\+ Workload: 1 (quick and easy) - 5 (insane)

-   3. figure out how big the matchmaking effect is + visualisation
-   4.  add some data analysis: point/rank graphs, 'most 10s' etc
-   5. make things bigger
-   5. Rename table no.
-   5. add success confirmations and errors:
    -   fill
    -   add/remove members
-   6. style the log page
-   ?. implement edit log and validate the endpoint (to reject point edits?)
-   8. allow delete logs with double-auth
-   8. refactor the css, particularly for sidebar transitions
-   9. Clear up event rerenders
-   10. Allow multiple clients to interact instantaneously:
    -   sqlite3 migration
    -   unauthorised page
    -   persist auth keys in db?
