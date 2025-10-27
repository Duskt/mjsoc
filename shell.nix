let
  pkgs = import <nixpkgs> { };
  # nixpkgs = fetchTarball "https://github.com/NixOS/nixpkgs/tarball/nixos-25.05";
  # pkgs = import nixpkgs { config = {}; overlays = []; };
in
pkgs.mkShellNoCC {
  packages = with pkgs; [
    # server (rust)
    pkg-config # req. for rust
    openssl # req. for rust
    rustup # includes rustc? however idk how to specify a cargo version
    gcc # a rust dependency needs the linker

    # client (node)
    nodejs_24 # other deps installed locally via npm
    prettier

    # setup utils (creating password hash for .env)
    libargon2
    # deployment
    google-cloud-sdk
  ];
}
