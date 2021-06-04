with (import <nixpkgs> { });

let
  nodeSources = runCommand "node-sources" { } ''
    tar --no-same-owner --no-same-permissions -xf "${nodejs.src}"
    mv node-* $out
  '';
in mkYarnPackage {
  name = "comicfury-discord-webhook";
  src = ./.;
  packageJSON = ./package.json;
  yarnLock = ./yarn.lock;
  yarnNix = ./yarn.nix;
  buildPhase = "yarn --offline run postinstall";
  pkgConfig = {
    better-sqlite3 = {
      buildInputs = [ python ];
      postInstall = ''
        # build native sqlite bindings
        npm run build-release --offline --nodedir="${nodeSources}"
      '';
    };
  };
}
