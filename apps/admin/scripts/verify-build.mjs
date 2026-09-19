// Fails if the production bundle would reach outside its own origin or ship
// development leftovers. Run after `vite build` (see the `verify:build` script).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";

const dist = resolve(import.meta.dirname, "../dist");
const forbidden = [
  // A dev-server/API address always carries a port. (A bare `http://localhost` is a
  // no-op fallback inside the router library itself, so it is not matched.)
  [/https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+|\/)/i, "localhost URL"],
  [/fonts\.(googleapis|gstatic)\.com/i, "third-party font CDN"],
  [/VITE_DEMO|DEMO DATA|Math\.random\(\)\s*\*\s*\d+.*mock/i, "demo/mock marker"],
  [/sourceMappingURL=/i, "source map reference"],
];

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else yield path;
  }
}

const problems = [];
for (const file of walk(dist)) {
  if (![".js", ".css", ".html"].includes(extname(file))) continue;
  const text = readFileSync(file, "utf8");
  for (const [pattern, label] of forbidden) {
    if (pattern.test(text)) problems.push(`${file.replace(dist, "dist")}: ${label}`);
  }
}
const html = readFileSync(join(dist, "index.html"), "utf8");
if (!/woff2/.test(readdirSync(join(dist, "assets")).join(" "))) {
  problems.push("dist/assets: no self-hosted woff2 fonts were bundled");
}
if (/<script[^>]+src="https?:/i.test(html)) problems.push("dist/index.html: external script");

if (problems.length) {
  console.error("Admin build verification failed:\n  - " + problems.join("\n  - "));
  process.exit(1);
}
console.log("Admin build verified: same-origin, self-hosted fonts, no dev leftovers.");
