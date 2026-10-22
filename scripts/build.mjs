import {
  mkdir,
  readFile,
  writeFile,
  readdir,
  unlink,
  lstat,
} from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const root = fileURLToPath(new URL("../", import.meta.url));
export const assets = [
  "app.js",
  "catalog.js",
  "design.js",
  "geometry.js",
  "geometry-primitives.js",
  "geometry-desks.js",
  "geometry-desk-variants.js",
  "geometry-seating.js",
  "geometry-benches.js",
  "viewer.js",
  "storage.js",
  "parts.js",
  "parts-registry.js",
  "parts-desks.js",
  "parts-desk-variants.js",
  "parts-seating.js",
  "parts-benches.js",
  "picking.js",
  "parts-controls.js",
  "style.css",
];
export const outputFiles = [
  "index.html",
  ...assets.map((f) => "studio/" + f),
  "404.html",
  "_headers",
  ".nojekyll",
  "manifest.json",
];
export const policy =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'";

export async function build() {
  const destination = path.join(root, "dist");
  // Refuse directory symlinks; clean files only inside the fixed output directory.
  async function clean(directory) {
    await mkdir(directory, { recursive: true });
    if ((await lstat(directory)).isSymbolicLink())
      throw Error("Build directory must not be a symlink.");
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) await clean(target);
      else await unlink(target);
    }
  }
  await clean(destination);
  await mkdir(path.join(destination, "studio"), { recursive: true });
  const files = new Map();
  files.set(
    "index.html",
    await readFile(path.join(root, "public/studio/index.html")),
  );
  for (const file of assets)
    files.set(
      "studio/" + file,
      await readFile(path.join(root, "public/studio", file)),
    );
  files.set(
    "404.html",
    Buffer.from(
      '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page not found — FORM</title><h1>Page not found</h1><p>FORM Object Studio is a single-page static demo. Open the site home to customize an object.</p></html>',
    ),
  );
  files.set(".nojekyll", Buffer.from(""));
  files.set(
    "_headers",
    Buffer.from(
      `/*\n  Content-Security-Policy: ${policy}; frame-ancestors 'none'\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n`,
    ),
  );
  const hashes = Object.fromEntries(
    [...files].map(([name, data]) => [
      name,
      createHash("sha256").update(data).digest("hex"),
    ]),
  );
  files.set(
    "manifest.json",
    Buffer.from(
      JSON.stringify(
        { name: "FORM Object Studio", version: "1.6.0", files: hashes },
        null,
        2,
      ) + "\n",
    ),
  );
  for (const [name, data] of files)
    await writeFile(path.join(destination, name), data);
  return hashes;
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const hashes = await build();
  console.log(
    `Built FORM Object Studio v1.6.0: ${Object.keys(hashes).length + 1} static files in dist/.`,
  );
}
