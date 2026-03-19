// input: HTTP requests plus filesystem and OpenClaw provider dependencies
// output: API responses, static asset responses, and SPA fallback HTML
// pos: server request entrypoint that composes backend routes with client asset serving
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, extname, join, normalize } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { FilesystemProvider } from "./providers/filesystem/types.js";
import type { OpenClawProvider } from "./providers/openclaw/types.js";
import { createConfiguredProviders, type ClusterEnvironment } from "./providers/cluster/createConfiguredProviders.js";
import { createAppRouter, isApiPath } from "./routes/appRouter.js";

const SERVER_MODULE_DIR = dirname(fileURLToPath(import.meta.url));

const CONTENT_TYPES: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

function sendJson(response: ServerResponse, statusCode: number, payload: unknown) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(payload));
}

async function sendFile(response: ServerResponse, filePath: string) {
  try {
    const fileStats = await stat(filePath);

    if (!fileStats.isFile()) {
      sendJson(response, 404, { error: "Not found" });
      return;
    }

    response.writeHead(200, {
      "Content-Type": CONTENT_TYPES[extname(filePath)] ?? "application/octet-stream"
    });
    createReadStream(filePath).pipe(response);
  } catch {
    sendJson(response, 404, { error: "Not found" });
  }
}

function isDocumentRoute(pathname: string) {
  return pathname.endsWith("/") || extname(pathname) === "";
}

export function resolveDefaultClientDir(serverModulePath: string) {
  const serverModuleDir = dirname(serverModulePath);
  const distRoot =
    serverModuleDir.endsWith(`${join("dist", "server", "server")}`) ||
    serverModuleDir.endsWith("dist/server/server")
      ? join(serverModuleDir, "..", "..")
      : join(serverModuleDir, "..", "..", "dist");

  return join(distRoot, "client");
}

export function createApp(options?: {
  clientDir?: string;
  filesystemProvider?: FilesystemProvider;
  openClawProvider?: OpenClawProvider;
  env?: ClusterEnvironment;
}) {
  const clientDir = options?.clientDir ?? resolveDefaultClientDir(fileURLToPath(import.meta.url));
  const configuredProviders =
    options?.filesystemProvider && options?.openClawProvider
      ? {
          filesystemProvider: options.filesystemProvider,
          openClawProvider: options.openClawProvider
        }
      : createConfiguredProviders(process.cwd(), options?.env ?? process.env);
  const apiRouter = createAppRouter({
    filesystemProvider: options?.filesystemProvider ?? configuredProviders.filesystemProvider,
    openClawProvider: options?.openClawProvider ?? configuredProviders.openClawProvider
  });

  return async (request: IncomingMessage, response: ServerResponse) => {
    const method = request.method ?? "GET";
    const url = new URL(request.url ?? "/", "http://localhost");

    if (isApiPath(url.pathname)) {
      // Keep API handling ahead of static and SPA routing so dashboard data paths
      // never get swallowed by the client-side fallback.
      const handled = await apiRouter(request, response);

      if (!handled) {
        sendJson(response, 404, { error: "Not found" });
      }

      return;
    }

    if (method !== "GET") {
      sendJson(response, 405, { error: "Method not allowed" });
      return;
    }

    const relativePath = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    const safePath = normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, "");
    const filePath = join(clientDir, safePath);

    if (existsSync(filePath)) {
      await sendFile(response, filePath);
      return;
    }

    if (isDocumentRoute(url.pathname)) {
      // Any other document-like path belongs to the SPA shell.
      await sendFile(response, join(clientDir, "index.html"));
      return;
    }

    sendJson(response, 404, { error: "Not found" });
  };
}
