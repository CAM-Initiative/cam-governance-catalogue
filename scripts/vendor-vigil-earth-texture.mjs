/**
 * One-time, reproducible vendoring of the NASA Blue Marble texture used by
 * the 3D dashboard. A known Git blob SHA guards against mutable image sources.
 * Bundling avoids external image/CDN availability and cross-origin dependencies
 * during public demos. Does not download runtime scripts or code.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dest = resolve(root, "src/public/assets/earth-blue-marble.jpg");
const expectedGitBlob = "e673a7c5e3da3f299d70c9daf608db4f6f9f2682";
const urls = [
  "https://raw.githubusercontent.com/vasturiano/three-globe/1e1f4400b80179809f761e632e207d9a3cfc298e/example/img/earth-blue-marble.jpg",
  "https://unpkg.com/three-globe@2.45.2/example/img/earth-blue-marble.jpg",
];
function fingerprint(data) {
  const header = Buffer.from(`blob ${data.length}\0`, "utf8");
  return createHash("sha1").update(header).update(data).digest("hex");
}
function verified(data) {
  return data.length === 1461877 && data[0] === 0xff && data[1] === 0xd8 && fingerprint(data) === expectedGitBlob;
}
let previous = await readFile(dest).catch(() => null);
if (previous && verified(previous)) {
  console.log("Verified local NASA Blue Marble image; no network download.");
  process.exit(0);
}
for (const url of urls) {
  try {
    const result = await fetch(url, { signal: AbortSignal.timeout(25000), headers: { Accept: "image/jpeg" } });
    if (!result.ok) throw new Error(`HTTP ${result.status}`);
    const data = Buffer.from(await result.arrayBuffer());
    if (!verified(data)) throw new Error("unexpected bytes; pinned image SHA verification failed");
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, data);
    console.log("Vendored verified Earth texture to src/public/assets (NASA Blue Marble).");
    process.exit(0);
  } catch (error) {
    console.warn(`Earth texture mirror unavailable: ${error.message}`);
  }
}
throw new Error("Could not vendor a verified satellite texture; refusing silent asset substitution.");
