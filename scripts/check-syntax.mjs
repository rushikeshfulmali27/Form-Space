import { readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
for (const directory of [
  "public/studio",
  "scripts",
  "tests",
  "tests/browser",
]) {
  for (const file of readdirSync(directory).filter((f) => /\.(m?js)$/.test(f)))
    execFileSync(process.execPath, ["--check", `${directory}/${file}`], {
      stdio: "inherit",
    });
}
execFileSync(process.execPath, ["--check", "playwright.config.mjs"], {
  stdio: "inherit",
});
console.log(
  "JavaScript syntax checks passed. No TypeScript source remains in v1.",
);
