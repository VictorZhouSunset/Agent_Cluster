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
        agentName: "Gate Node Agent",
        nodeId: "gate-node",
        nodeName: "Gate Node"
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
        name: "Gate Node Agent",
        status: "idle",
        summary: "Stubbed local agent status.",
        updatedAt: "2026-03-12T00:00:00.000Z"
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
      agentName: "Gate Node Agent",
      nodeId: "gate-node",
      nodeName: "Gate Node",
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
      agents: [
        {
          id: "agent-custom",
          name: "Custom Agent",
          status: "running" as const,
          summary: "Adapter agent",
          updatedAt: "2026-03-11T12:00:00.000Z"
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

    const agents = await provider.listAgents();
    agents[0].name = "Mutated agent";

    const sessions = await provider.listSessions();

    expect(sessions).toEqual(adapterState.sessionSummaries);
    await expect(provider.getHealth()).resolves.toEqual(adapterState.health);
    await expect(provider.listAgents()).resolves.toEqual(adapterState.agents);
    await expect(provider.getSession("session-custom")).resolves.toEqual(
      adapterState.sessionDetails["session-custom"]
    );
  });
});
