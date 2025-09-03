let
  nixpkgs = fetchTarball "https://github.com/NixOS/nixpkgs/tarball/nixos-25.05";
  pkgs = import nixpkgs { config = {}; overlays = []; };
in

pkgs.mkShellNoCC {
  packages = with pkgs; [
    # server
    rustup
    cargo
    rustc
    # necessary to build rust source code
    pkg-config
    openssl

    # client
    esbuild
    typescript
    nodejs_24

    # setup utils
    libargon2
  ];
}
