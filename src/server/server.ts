import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { IR } from "../core/ir.js";

const VIEWER_DIR = fileURLToPath(new URL("../../dist/viewer/", import.meta.url));

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
};

export type Serving = { url: string; close: () => Promise<void> };

/** Serves the built viewer and the IR at `/ir.json`. Port 0 picks a free port. */
export async function serve(ir: IR, port: number): Promise<Serving> {
  if (!existsSync(path.join(VIEWER_DIR, "index.html"))) {
    throw new Error(`The viewer is not built (${VIEWER_DIR}). Run \`pnpm build\` first.`);
  }

  const server = createServer((request, response) => {
    const urlPath = new URL(request.url ?? "/", "http://localhost").pathname;

    if (urlPath === "/ir.json") {
      response.writeHead(200, { "Content-Type": CONTENT_TYPES[".json"] });
      response.end(JSON.stringify(ir));
      return;
    }

    const file = path.join(VIEWER_DIR, urlPath === "/" ? "index.html" : urlPath);
    if (!file.startsWith(VIEWER_DIR) || !existsSync(file)) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { "Content-Type": CONTENT_TYPES[path.extname(file)] ?? "application/octet-stream" });
    response.end(readFileSync(file));
  });

  await new Promise<void>((resolve) => server.listen(port, "localhost", resolve));
  const { port: actualPort } = server.address() as AddressInfo;

  return {
    url: `http://localhost:${actualPort}/`,
    close: () => new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
  };
}
