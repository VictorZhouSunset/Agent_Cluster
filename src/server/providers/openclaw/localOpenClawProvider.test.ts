// input: stubbed local adapter state and the local OpenClaw provider factory
// output: assertions for normalized local health, node, agent, and session reads with current cluster naming
// pos: provider tests for the local OpenClaw runtime wrapper
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { LocalOpenClawAdapter } from "./types";
import type { SessionDetail } from "../../../shared/types";
import { describe, expect, it } from "vitest";
import { createLocalOpenClawProvider } from "./localOpenClawProvider";

describe("local OpenClaw provider", () => {
  it("returns normalized health", async () => {
    const provider = createLocalOpenClawProvider();
    const result = await provider.getHealth();
    expect(result).toMatchObject({
      status: "healthy",
      checkedAt: "2026-03-12T00:00:00.000Z",
      summary: "Local OpenClaw stub is responding."
    });
    expect(Number.isNaN(Date.parse(result.checkedAt))).toBe(false);
  });

  it("returns a session list", async () => {
    const provider = createLocalOpenClawProvider();
    const sessions = await provider.listSessions();
    expect(sessions).toEqual([
      {
        id: "session-local-1",
        title: "Stub Session",
        updatedAt: "2026-03-12T00:00:00.000Z",
        startedAt: "2026-03-12T00:00:00.000Z",
        status: "active",
        agentId: "agent-gate",
        agentName: "OpenMoose03_CIO Agent",
        nodeId: "openmoose03-cio",
        nodeName: "OpenMoose03_CIO"
      }
    ]);
    expect("messages" in sessions[0]).toBe(false);
  });

  it("returns an agent list", async () => {
    const provider = createLocalOpenClawProvider();
    const agents = await provider.listAgents();

    expect(agents).toEqual([
      {
        id: "agent-gate",
        name: "OpenMoose03_CIO Agent",
        status: "idle",
        summary: "Stubbed local agent status.",
        updatedAt: "2026-03-12T00:00:00.000Z",
        nodeId: "openmoose03-cio",
        nodeName: "OpenMoose03_CIO"
      }
    ]);
  });

  it("returns a local node inventory", async () => {
    const provider = createLocalOpenClawProvider();

    await expect(provider.listNodes()).resolves.toEqual([
      {
        id: "openmoose03-cio",
        name: "OpenMoose03_CIO",
        kind: "gate",
        origin: "local",
        status: "healthy",
        checkedAt: "2026-03-12T00:00:00.000Z",
        summary: "Local OpenClaw stub is responding.",
        supportsSessions: true,
        supportsSkills: true,
        supportsFiles: true,
        supportsWrites: true
      }
    ]);
  });

  it("returns a session by id", async () => {
    const provider = createLocalOpenClawProvider();
    const session = await provider.getSession("session-local-1");

    expect(session).toEqual({
      id: "session-local-1",
      title: "Stub Session",
      updatedAt: "2026-03-12T00:00:00.000Z",
      startedAt: "2026-03-12T00:00:00.000Z",
      status: "active",
      agentId: "agent-gate",
      agentName: "OpenMoose03_CIO Agent",
      nodeId: "openmoose03-cio",
      nodeName: "OpenMoose03_CIO",
      messages: [
        {
          id: "message-local-1",
          role: "assistant",
          content: "This is stubbed session content for dashboard wiring.",
          createdAt: "2026-03-12T00:00:00.000Z"
        }
      ]
    });
  });

  it("returns null for an unknown session id", async () => {
    const provider = createLocalOpenClawProvider();

    await expect(provider.getSession("unknown-session")).resolves.toBeNull();
  });

  it("supports custom adapter injection and clones returned data", async () => {
    const adapterState = {
      health: {
        status: "degraded" as const,
        checkedAt: "2026-03-11T12:00:00.000Z",
        summary: "Adapter health"
      },
      nodes: [
        {
          id: "agent-custom-node",
          name: "Custom Node",
          kind: "gate" as const,
          origin: "local" as const,
          status: "healthy" as const,
          checkedAt: "2026-03-11T12:00:00.000Z",
          supportsSessions: true,
          supportsSkills: true,
          supportsFiles: true,
          supportsWrites: true
        }
      ],
      agents: [
        {
          id: "agent-custom",
          name: "Custom Agent",
          status: "running" as const,
          summary: "Adapter agent",
          updatedAt: "2026-03-11T12:00:00.000Z",
          nodeId: "agent-custom-node",
          nodeName: "Custom Node"
        }
      ],
      sessionSummaries: [
        {
          id: "session-custom",
          title: "Custom Session",
          updatedAt: "2026-03-11T12:00:00.000Z",
          status: "idle" as const,
          agentId: "agent-custom"
        }
      ],
      sessionDetails: {
        "session-custom": {
          id: "session-custom",
          title: "Custom Session",
          updatedAt: "2026-03-11T12:00:00.000Z",
          status: "idle" as const,
          agentId: "agent-custom",
          messages: [
            {
              id: "message-custom",
              role: "user" as const,
              content: "hello",
              createdAt: "2026-03-11T12:00:00.000Z"
            }
          ]
        }
      } as Record<string, SessionDetail>
    };

    const adapter: LocalOpenClawAdapter = {
      async readHealth() {
        return adapterState.health;
      },
      async listNodes() {
        return adapterState.nodes;
      },
      async listAgents() {
        return adapterState.agents;
      },
      async listSessions() {
        return adapterState.sessionSummaries;
      },
      async getSession(sessionId) {
        return adapterState.sessionDetails[sessionId] ?? null;
      }
    };

    const provider = createLocalOpenClawProvider({ adapter });

    const health = await provider.getHealth();
    health.summary = "Mutated health";

    const nodes = await provider.listNodes();
    nodes[0].name = "Mutated node";

    const agents = await provider.listAgents();
    agents[0].name = "Mutated agent";

    const sessions = await provider.listSessions();

    expect(sessions).toEqual(adapterState.sessionSummaries);
    await expect(provider.getHealth()).resolves.toEqual(adapterState.health);
    await expect(provider.listNodes()).resolves.toEqual(adapterState.nodes);
    await expect(provider.listAgents()).resolves.toEqual(adapterState.agents);
    await expect(provider.getSession("session-custom")).resolves.toEqual(
      adapterState.sessionDetails["session-custom"]
    );
  });

  it("reads real sessions from the local OpenClaw session store", async () => {
    const homeDir = await mkdtemp(join(tmpdir(), "gate-dashboard-openclaw-"));
    const sessionId = "916b22ea-e1ff-42c3-8c53-e77b8c60e2e3";
    const sessionsDir = join(homeDir, ".openclaw", "agents", "main", "sessions");

    try {
      await mkdir(sessionsDir, { recursive: true });
      await writeFile(
        join(sessionsDir, "sessions.json"),
        JSON.stringify(
          {
            main: {
              sessionId,
              displayName: "Morning standup",
              updatedAt: "2026-03-19T18:01:42.000Z",
              createdAt: "2026-03-19T17:50:00.000Z",
              status: "active"
            }
          },
          null,
          2
        ),
        "utf8"
      );
      await writeFile(
        join(sessionsDir, `${sessionId}.jsonl`),
        [
          JSON.stringify({
            type: "message",
            id: "message-system",
            role: "system",
            content: "You are OpenClaw.",
            createdAt: "2026-03-19T17:50:00.000Z"
          }),
          JSON.stringify({
            type: "message",
            id: "message-user",
            message: {
              role: "user",
              content: [{ type: "text", text: "Show me the cluster status." }]
            },
            timestamp: "2026-03-19T17:55:00.000Z"
          }),
          JSON.stringify({
            type: "message",
            id: "message-assistant",
            message: {
              role: "assistant",
              content: [
                { type: "text", text: "Cluster looks healthy." },
                { type: "tool_result", text: "Ignored tool blob." }
              ]
            },
            createdAt: "2026-03-19T18:01:42.000Z"
          }),
          JSON.stringify({
            type: "event",
            event: "heartbeat",
            createdAt: "2026-03-19T18:01:45.000Z"
          })
        ].join("\n"),
        "utf8"
      );

      const provider = createLocalOpenClawProvider({ homeDir });

      await expect(provider.listSessions()).resolves.toEqual([
        {
          id: sessionId,
          title: "Morning standup",
          updatedAt: "2026-03-19T18:01:42.000Z",
          startedAt: "2026-03-19T17:50:00.000Z",
          status: "active",
          agentId: "main",
          agentName: "OpenMoose03_CIO Agent",
          nodeId: "openmoose03-cio",
          nodeName: "OpenMoose03_CIO"
        }
      ]);
      await expect(provider.getSession(sessionId)).resolves.toEqual({
        id: sessionId,
        title: "Morning standup",
        updatedAt: "2026-03-19T18:01:42.000Z",
        startedAt: "2026-03-19T17:50:00.000Z",
        status: "active",
        agentId: "main",
        agentName: "OpenMoose03_CIO Agent",
        nodeId: "openmoose03-cio",
        nodeName: "OpenMoose03_CIO",
        messages: [
          {
            id: "message-system",
            role: "system",
            content: "You are OpenClaw.",
            createdAt: "2026-03-19T17:50:00.000Z"
          },
          {
            id: "message-user",
            role: "user",
            content: "Show me the cluster status.",
            createdAt: "2026-03-19T17:55:00.000Z"
          },
          {
            id: "message-assistant",
            role: "assistant",
            content: "Cluster looks healthy.\n\nIgnored tool blob.",
            createdAt: "2026-03-19T18:01:42.000Z"
          }
        ]
      });
    } finally {
      await rm(homeDir, { recursive: true, force: true });
    }
  });
});
