import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import type { FilesystemProvider } from "../providers/filesystem/types.js";
import { createLocalFilesystemProvider } from "../providers/filesystem/localFilesystemProvider.js";
import type { OpenClawProvider } from "../providers/openclaw/types.js";
import { createApp } from "../app";

describe("app router", () => {
  let rootDir: string;
  let clientDir: string;
  let filesystemProvider: FilesystemProvider;
  let openClawProvider: OpenClawProvider;

  beforeEach(async () => {
    rootDir = await mkdtemp(join(tmpdir(), "gate-dashboard-routes-"));
    clientDir = await mkdtemp(join(tmpdir(), "gate-dashboard-client-"));

    await Promise.all([
      writeFile(join(clientDir, "index.html"), "<!doctype html><html><body>Dashboard Shell</body></html>"),
      writeFile(join(rootDir, "AGENTS.md"), "# Agents"),
      writeFile(join(rootDir, "USER.md"), "# User"),
      mkdir(join(rootDir, "skills", "planner"), { recursive: true })
    ]);
    await writeFile(join(rootDir, "skills", "planner", "SKILL.md"), "# Planner");

    filesystemProvider = createLocalFilesystemProvider(rootDir);
    openClawProvider = {
      async getHealth() {
        return {
          status: "healthy",
          checkedAt: "2026-03-12T00:00:00.000Z",
          summary: "ok"
        };
      },
      async listAgents() {
        return [
          {
            id: "agent-1",
            name: "Planner",
            status: "idle",
            updatedAt: "2026-03-12T00:00:00.000Z"
          }
        ];
      },
      async listSessions() {
        return [
          {
            id: "session-1",
            title: "Session One",
            updatedAt: "2026-03-12T00:00:00.000Z",
            status: "active"
          }
        ];
      },
      async getSession(sessionId) {
        if (sessionId !== "session-1") {
          return null;
        }

        return {
          id: "session-1",
          title: "Session One",
          updatedAt: "2026-03-12T00:00:00.000Z",
          status: "active",
          messages: [
            {
              id: "message-1",
              role: "assistant",
              content: "hello",
              createdAt: "2026-03-12T00:00:00.000Z"
            }
          ]
        };
      }
    };
  });

  function createRouteApp(overrides?: {
    filesystemProvider?: FilesystemProvider;
    openClawProvider?: OpenClawProvider;
  }) {
    return createApp({
      clientDir,
      filesystemProvider: overrides?.filesystemProvider ?? filesystemProvider,
      openClawProvider: overrides?.openClawProvider ?? openClawProvider
    });
  }

  it("returns health data", async () => {
    const response = await request(createRouteApp()).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: {
        status: "healthy",
        checkedAt: "2026-03-12T00:00:00.000Z",
        summary: "ok"
      }
    });
  });

  it("returns agents data", async () => {
    const response = await request(createRouteApp()).get("/api/agents");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: [
        {
          id: "agent-1",
          name: "Planner",
          status: "idle",
          updatedAt: "2026-03-12T00:00:00.000Z"
        }
      ]
    });
  });

  it("returns sessions data", async () => {
    const response = await request(createRouteApp()).get("/api/sessions");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: [
        {
          id: "session-1",
          title: "Session One",
          updatedAt: "2026-03-12T00:00:00.000Z",
          status: "active"
        }
      ]
    });
  });

  it("returns session detail", async () => {
    const response = await request(createRouteApp()).get("/api/sessions/session-1");

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe("session-1");
    expect(response.body.data.messages).toEqual([
      {
        id: "message-1",
        role: "assistant",
        content: "hello",
        createdAt: "2026-03-12T00:00:00.000Z"
      }
    ]);
  });

  it("returns 404 for an unknown session", async () => {
    const response = await request(createRouteApp()).get("/api/sessions/unknown-session");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: "not_found",
        message: 'Session "unknown-session" was not found.'
      }
    });
  });

  it("lists file documents", async () => {
    const response = await request(createRouteApp()).get("/api/files");

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([
      expect.objectContaining({
        id: "agents-md",
        kind: "file",
        path: "AGENTS.md"
      }),
      expect.objectContaining({
        id: "user-md",
        kind: "file",
        path: "USER.md"
      })
    ]);
  });

  it("reads and saves a file document", async () => {
    const app = createRouteApp();

    const readResponse = await request(app).get("/api/files/agents-md");
    expect(readResponse.status).toBe(200);
    expect(readResponse.body.data.content).toContain("# Agents");

    const saveResponse = await request(app).put("/api/files/agents-md").send({ content: "# Updated Agents" });
    expect(saveResponse.status).toBe(200);
    expect(saveResponse.body.data.content).toBe("# Updated Agents");
    await expect(readFile(join(rootDir, "AGENTS.md"), "utf8")).resolves.toBe("# Updated Agents");
  });

  it("lists skill documents", async () => {
    const response = await request(createRouteApp()).get("/api/skills");

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([
      expect.objectContaining({
        id: "skill:planner",
        kind: "skill",
        path: "skills/planner/SKILL.md"
      })
    ]);
  });

  it("reads and saves a skill document", async () => {
    const app = createRouteApp();

    const readResponse = await request(app).get("/api/skills/planner");
    expect(readResponse.status).toBe(200);
    expect(readResponse.body.data.content).toContain("# Planner");

    const saveResponse = await request(app).put("/api/skills/planner").send({ content: "# Updated Planner" });
    expect(saveResponse.status).toBe(200);
    expect(saveResponse.body.data.content).toBe("# Updated Planner");
    await expect(readFile(join(rootDir, "skills", "planner", "SKILL.md"), "utf8")).resolves.toBe("# Updated Planner");
  });

  it("returns 404 for an unknown file id", async () => {
    const response = await request(createRouteApp()).get("/api/files/nope");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: "not_found",
        message: "Requested resource was not found."
      }
    });
  });

  it("returns 400 for invalid JSON request bodies", async () => {
    const response = await request(createRouteApp())
      .put("/api/files/agents-md")
      .set("Content-Type", "application/json")
      .send('{"content":');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: {
        code: "invalid_json",
        message: "Request body must be valid JSON."
      }
    });
  });

  it("returns 400 for malformed percent-encoded API paths", async () => {
    const response = await request(createRouteApp()).get("/api/files/%E0%A4%A");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: {
        code: "invalid_path",
        message: "Request path must be validly encoded."
      }
    });
  });

  it("maps provider failures to structured 500 responses", async () => {
    const failingProvider: OpenClawProvider = {
      ...openClawProvider,
      async listAgents() {
        throw new Error("boom");
      }
    };

    const response = await request(
      createRouteApp({
        openClawProvider: failingProvider
      })
    ).get("/api/agents");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: {
        code: "internal_error",
        message: "An unexpected server error occurred."
      }
    });
  });

  it("preserves SPA handling for non-api routes like /apiary", async () => {
    const response = await request(createRouteApp()).get("/apiary");

    expect(response.status).toBe(200);
    expect(response.text).toContain("Dashboard Shell");
  });
});
