import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(testDir, "..");

function packagePath(target) {
  return target.replace(/^\.\//, "");
}

test("npm package artifact contains every declared ordinary-user entry point", async () => {
  const packageJson = JSON.parse(
    await readFile(resolve(repoRoot, "package.json"), "utf8"),
  );

  const packed = spawnSync("npm", ["pack", "--dry-run", "--json"], {
    cwd: repoRoot,
    encoding: "utf8",
  });

  assert.equal(
    packed.status,
    0,
    `npm pack --dry-run failed:\n${packed.stderr || packed.stdout}`,
  );

  const packReport = JSON.parse(packed.stdout);
  assert.equal(packReport.length, 1, "expected exactly one npm pack report");

  const artifactFiles = new Set(packReport[0].files.map(({ path }) => path));

  for (const [command, target] of Object.entries(packageJson.bin ?? {})) {
    assert.ok(
      artifactFiles.has(packagePath(target)),
      `packed artifact is missing bin target for ${command}: ${target}`,
    );
  }

  for (const [exportName, target] of Object.entries(packageJson.exports ?? {})) {
    if (typeof target !== "string" || !target.startsWith("./")) continue;

    assert.ok(
      artifactFiles.has(packagePath(target)),
      `packed artifact is missing export ${exportName}: ${target}`,
    );
  }

  const bundlePatch = packageJson.dsh?.bundle?.patch;
  assert.equal(typeof bundlePatch, "string", "package must declare dsh.bundle.patch");
  assert.ok(
    artifactFiles.has(packagePath(bundlePatch)),
    `packed artifact is missing DSH bundle patch: ${bundlePatch}`,
  );
});
