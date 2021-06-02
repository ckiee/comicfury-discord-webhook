with (import <nixpkgs> { });

mkYarnPackage {
  name = "comicfury-discord-webhook";
  src = ./.;
  packageJSON = ./package.json;
  yarnLock = ./yarn.lock;
  yarnNix = ./yarn.nix;
  buildPhase = "yarn --offline run postinstall";
}
