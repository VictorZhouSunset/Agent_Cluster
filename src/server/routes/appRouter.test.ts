// input: temporary filesystem fixtures plus stubbed provider dependencies for API requests
// output: route-level assertions for dashboard API success and error responses
// pos: integration tests for the central dashboard API router
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
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
  let workspaceDir: string;
  let workspaceSkillsDir: string;

  beforeEach(async () => {
    rootDir = await mkdtemp(join(tmpdir(), "gate-dashboard-routes-"));
    clientDir = await mkdtemp(join(tmpdir(), "gate-dashboard-client-"));
    workspaceDir = join(rootDir, ".openclaw", "workspace");
    workspaceSkillsDir = join(workspaceDir, "skills");

    await mkdir(join(workspaceSkillsDir, "planner"), { recursive: true });
    await Promise.all([
      writeFile(join(clientDir, "index.html"), "<!doctype html><html><body>Dashboard Shell</body></html>"),
      writeFile(join(workspaceDir, "AGENTS.md"), "# Agents"),
      writeFile(join(workspaceDir, "USER.md"), "# User")
    ]);
    await writeFile(join(workspaceSkillsDir, "planner", "SKILL.md"), "# Planner");

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
      async listNodes() {
        return [
          {
            id: "agent-1",
            name: "Gate Node",
            kind: "gate",
            origin: "local",
            status: "healthy",
            checkedAt: "2026-03-12T00:00:00.000Z",
            summary: "ok",
            supportsSessions: true,
            supportsSkills: true,
            supportsFiles: true,
            supportsWrites: true
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

  it("returns node data", async () => {
    const response = await request(createRouteApp()).get("/api/nodes");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: [
        {
          id: "agent-1",
          name: "Gate Node",
          kind: "gate",
          origin: "local",
          status: "healthy",
          checkedAt: "2026-03-12T00:00:00.000Z",
          summary: "ok",
          supportsSessions: true,
          supportsSkills: true,
          supportsFiles: true,
          supportsWrites: true
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
        path: join(workspaceDir, "AGENTS.md")
      }),
      expect.objectContaining({
        id: "user-md",
        kind: "file",
        path: join(workspaceDir, "USER.md")
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
    await expect(readFile(join(workspaceDir, "AGENTS.md"), "utf8")).resolves.toBe("# Updated Agents");
  });

  it("passes the requested node id through document routes", async () => {
    const observedCalls: Array<Record<string, unknown>> = [];
    const nodeAwareFilesystemProvider: FilesystemProvider = {
      ...filesystemProvider,
      async listEditableDocuments(options) {
        observedCalls.push({ type: "list", options });
        return filesystemProvider.listEditableDocuments();
      },
      async readEditableDocument(documentId, options) {
        observedCalls.push({ type: "read", documentId, options });
        return filesystemProvider.readEditableDocument(documentId);
      },
      async writeEditableDocument(input) {
        observedCalls.push({ type: "write", input });
        return filesystemProvider.writeEditableDocument({
          id: input.id,
          content: input.content
        });
      }
    };

    const app = createRouteApp({
      filesystemProvider: nodeAwareFilesystemProvider
    });

    await request(app).get("/api/files?node=agent-2");
    await request(app).get("/api/files/agents-md?node=agent-2");
    await request(app).put("/api/files/agents-md?node=agent-2").send({ content: "# Updated Agents" });

    expect(observedCalls).toEqual([
      {
        type: "list",
        options: { kind: "file", nodeId: "agent-2" }
      },
      {
        type: "read",
        documentId: "agents-md",
        options: { kind: "file", nodeId: "agent-2" }
      },
      {
        type: "write",
        input: {
          id: "agents-md",
          kind: "file",
          nodeId: "agent-2",
          content: "# Updated Agents"
        }
      }
    ]);
  });

  it("lists skill documents", async () => {
    const response = await request(createRouteApp()).get("/api/skills");

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([
      expect.objectContaining({
        id: "skill:workspace:planner",
        kind: "skill",
        path: join(workspaceSkillsDir, "planner", "SKILL.md")
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
    await expect(readFile(join(workspaceSkillsDir, "planner", "SKILL.md"), "utf8")).resolves.toBe("# Updated Planner");
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
