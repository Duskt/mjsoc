This repository contains both server and client files. The **Rust** server
handles:

- Authentication
- QR code (scanning, i.e. the link you're taken to, and generation)
- API
- HTTP requests

The client is **Typescript** code bundled into an index.js file which is sent
along with the web pages. This handles most of the mahjong interface, such as
tables and scoring.

# Deploying

TODO: actually document setup `gcloud run services list` SERVICE REGION URL LAST
DEPLOYED BY LAST DEPLOYED AT ✔ mjsoc europe-west2 https://...\
`gcloud run deploy --source . mjsoc`

- `--source .` means use the current directly (where Dockerfile should be
  located) to build an image anew
- mjsoc is the service to deploy to `gcloud run services replace service.yaml`
