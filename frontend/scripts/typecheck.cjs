const { spawnSync } = require("node:child_process");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const nodeBin = process.execPath;
const nextCli = path.join(root, "node_modules", "next", "dist", "bin", "next");
const tscCli = path.join(root, "node_modules", "typescript", "bin", "tsc");

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: false,
  });
  if (result.error) {
    throw result.error;
  }
  if ((result.status ?? 0) !== 0) {
    process.exit(result.status ?? 1);
  }
}

run(nodeBin, [nextCli, "typegen"]);
run(nodeBin, [tscCli, "--noEmit"]);
