import http from "node:http";
import { readFile, realpath, watch } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build, root, outputFiles, policy } from "./build.mjs";

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};
export function createServer({ prefix = "" } = {}) {
  return http.createServer(async (req, res) => {
    if (!/^(?:127\.0\.0\.1|localhost)(?::\d+)?$/.test(req.headers.host || "")) {
      res.writeHead(403);
      return res.end();
    }
    res.setHeader(
      "Content-Security-Policy",
      policy + "; frame-ancestors 'none'",
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Cache-Control", "no-store");
    if (!["GET", "HEAD"].includes(req.method)) {
      res.writeHead(405, { Allow: "GET, HEAD" });
      return res.end();
    }
    let requestPath;
    try {
      requestPath = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
    } catch {
      res.writeHead(400);
      return res.end();
    }
    if (prefix && !requestPath.startsWith(prefix + "/")) {
      res.writeHead(404);
      return res.end();
    }
    requestPath = requestPath.slice(prefix.length);
    const file = requestPath === "/" ? "index.html" : requestPath.slice(1);
    if (
      !outputFiles.includes(file) ||
      file === "_headers" ||
      file === ".nojekyll"
    ) {
      res.writeHead(404);
      return res.end("Page not found");
    }
    try {
      const directory = path.join(root, "dist");
      const resolved = await realpath(path.join(directory, file));
      if (!resolved.startsWith((await realpath(directory)) + path.sep)) {
        res.writeHead(404);
        return res.end();
      }
      const data = await readFile(resolved);
      res.writeHead(200, {
        "Content-Type": types[path.extname(file)] || "application/octet-stream",
        "Content-Length": data.length,
      });
      res.end(req.method === "HEAD" ? undefined : data);
    } catch {
      res.writeHead(404);
      res.end("Build the app with npm run build first.");
    }
  });
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const watching = process.argv.includes("--watch");
  if (watching) await build();
  const portIndex = process.argv.indexOf("--port");
  const port = Number(portIndex < 0 ? 5173 : process.argv[portIndex + 1]);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw Error("Invalid port.");
  const prefixIndex = process.argv.indexOf("--prefix");
  const prefix = prefixIndex < 0 ? "" : process.argv[prefixIndex + 1];
  if (prefix && !/^\/[a-zA-Z0-9_-]+$/.test(prefix))
    throw Error("Invalid preview prefix.");
  const server = createServer({ prefix });
  server.on("error", (error) => {
    console.error(
      error.code === "EADDRINUSE"
        ? `Port ${port} is already in use.`
        : "Preview server failed.",
    );
    process.exitCode = 1;
  });
  server.listen(port, "127.0.0.1", () =>
    console.log(`FORM Object Studio: http://127.0.0.1:${port}${prefix}/`),
  );
  if (watching) {
    let timer;
    (async () => {
      for await (const event of watch(path.join(root, "public/studio"))) {
        if (!event.filename) continue;
        clearTimeout(timer);
        timer = setTimeout(
          () =>
            build()
              .then(() => console.log("Rebuilt dist/. Reload the browser."))
              .catch(() => console.error("Build failed.")),
          100,
        );
      }
    })().catch(() =>
      console.error(
        "File watching unavailable. Run npm run build after editing.",
      ),
    );
  }
}
