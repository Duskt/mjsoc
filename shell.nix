let
  nixpkgs = fetchTarball "https://github.com/NixOS/nixpkgs/tarball/nixos-25.05";
  pkgs = import nixpkgs { config = {}; overlays = []; };
in

pkgs.mkShellNoCC {
  packages = with pkgs; [
    # server (rust)
    pkg-config # req. for rust
    openssl # req. for rust
    rustup # incl. cargo, rustc

    # client (node)
    nodejs_24 # other deps installed locally via npm

    # setup utils (creating password hash for .env)
    libargon2
  ];
}
