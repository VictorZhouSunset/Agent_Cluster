import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, normalize } from "node:path";
import { createServer } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { createApp, resolveDefaultClientDir } from "./app";

const servers: Array<ReturnType<typeof createServer>> = [];

afterEach(async () => {
  await Promise.all(
    servers.map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => {
            if (error) {
              reject(error);
              return;
            }

            resolve();
          });
        })
    )
  );
  servers.length = 0;
});

async function createFixtureClientDir() {
  const clientDir = await mkdtemp(join(tmpdir(), "gate-dashboard-app-"));
  await writeFile(join(clientDir, "index.html"), "<!doctype html><html><body>Dashboard</body></html>");
  await writeFile(join(clientDir, "app.js"), "console.log('dashboard');");
  return clientDir;
}

async function startApp(clientDir: string) {
  const server = createServer(createApp({ clientDir }));
  servers.push(server);

  await new Promise<void>((resolve, reject) => {
    server.listen(0, () => resolve());
    server.once("error", reject);
  });

  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Expected TCP server address");
  }

  return `http://127.0.0.1:${address.port}`;
}

describe("createApp", () => {
  it("resolves the default client dir for built server output", () => {
    const clientDir = resolveDefaultClientDir("/srv/gate-dashboard/dist/server/server/app.js");

    expect(normalize(clientDir)).toBe(normalize("/srv/gate-dashboard/dist/client"));
  });

  it("serves index.html for document routes", async () => {
    const clientDir = await createFixtureClientDir();
    const baseUrl = await startApp(clientDir);

    const response = await fetch(`${baseUrl}/sessions/123`);

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toContain("Dashboard");
  });

  it("returns 404 for missing asset requests", async () => {
    const clientDir = await createFixtureClientDir();
    const baseUrl = await startApp(clientDir);

    const response = await fetch(`${baseUrl}/missing.js`);

    expect(response.status).toBe(404);
  });
});
