// input: process environment, request handler app, and optional HTTP server factory
// output: started HTTP server bound to the resolved dashboard port
// pos: server bootstrap entrypoint for the Gate dashboard backend
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import { createServer, type RequestListener } from "node:http";
import { pathToFileURL } from "node:url";
import { createApp } from "./app.js";

type ServerEnvironment = {
  PORT?: string;
};

type StartServerOptions = {
  env?: ServerEnvironment;
  app?: RequestListener;
  createHttpServer?: (app: RequestListener) => ServerLike;
  log?: (message: string) => void;
};

type ServerLike = {
  listen: (port: number, onListen?: () => void) => unknown;
};

export function resolvePort(env: ServerEnvironment = process.env) {
  const rawPort = Number(env.PORT ?? 3000);

  return Number.isFinite(rawPort) ? rawPort : 3000;
}

export function startServer({
  env = process.env,
  app = createApp(),
  createHttpServer = createServer,
  log = console.log
}: StartServerOptions = {}) {
  const port = resolvePort(env);
  const server = createHttpServer(app);

  server.listen(port, () => {
    log(`Gate dashboard listening on http://localhost:${port}`);
  });

  return server;
}

function isExecutedDirectly() {
  const entryPath = process.argv[1];

  if (!entryPath) {
    return false;
  }

  return import.meta.url === pathToFileURL(entryPath).href;
}

if (isExecutedDirectly()) {
  // Avoid opening a real listener when the module is imported from tests.
  startServer();
}
