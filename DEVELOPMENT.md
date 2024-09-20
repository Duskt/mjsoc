As described in the README, this repository contains both server and
client files. The **Rust** server handles:

-   Authentication
-   QR code (scanning, i.e. the link you're taken to, and generation)
-   API
-   HTTP requests

The client is **Typescript** code bundled into an index.js file which
is sent along with the web pages. This handles most of the mahjong
interface, such as tables and scoring.
