// input: local OpenClaw-facing adapter hooks and fallback stub data
// output: normalized dashboard health, agent, and session data for backend routes
// pos: local OpenClaw provider implementation used by the dashboard backend
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import type {
  AgentStatus,
  DashboardHealth,
  SessionDetail,
  SessionSummary,
  SessionMessage
} from "../../../shared/types.js";
import type {
  CreateLocalOpenClawProviderOptions,
  LocalOpenClawAdapter,
  OpenClawProvider
} from "./types.js";

const stubHealth: DashboardHealth = {
  status: "healthy",
  checkedAt: "2026-03-12T00:00:00.000Z",
  summary: "Local OpenClaw stub is responding."
};

const stubAgents: AgentStatus[] = [
  {
    id: "agent-gate",
    name: "Gate Node Agent",
    status: "idle",
    summary: "Stubbed local agent status.",
    updatedAt: "2026-03-12T00:00:00.000Z"
  }
];

const stubSessionSummaries: SessionSummary[] = [
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
];

const stubSessionDetails: Record<string, SessionDetail> = {
  "session-local-1": {
    ...stubSessionSummaries[0],
    messages: [
      {
        id: "message-local-1",
        role: "assistant",
        content: "This is stubbed session content for dashboard wiring.",
        createdAt: "2026-03-12T00:00:00.000Z"
      }
    ]
  }
};

export function createLocalOpenClawProvider(
  options: CreateLocalOpenClawProviderOptions = {}
): OpenClawProvider {
  const adapter = options.adapter ?? createStubAdapter();

  return {
    async getHealth(): Promise<DashboardHealth> {
      return cloneHealth(await adapter.readHealth());
    },
    async listAgents(): Promise<AgentStatus[]> {
      const agents = await adapter.listAgents();
      return agents.map(cloneAgent);
    },
    async listSessions(): Promise<SessionSummary[]> {
      const sessions = await adapter.listSessions();
      return sessions.map(cloneSessionSummary);
    },
    async getSession(sessionId: string): Promise<SessionDetail | null> {
      const session = await adapter.getSession(sessionId);
      return session ? cloneSessionDetail(session) : null;
    }
  };
}

function createStubAdapter(): LocalOpenClawAdapter {
  return {
    async readHealth() {
      return cloneHealth(stubHealth);
    },
    async listAgents() {
      return stubAgents.map(cloneAgent);
    },
    async listSessions() {
      return stubSessionSummaries.map(cloneSessionSummary);
    },
    async getSession(sessionId: string) {
      const session = stubSessionDetails[sessionId];
      return session ? cloneSessionDetail(session) : null;
    }
  };
}

function cloneHealth(health: DashboardHealth): DashboardHealth {
  return { ...health };
}

function cloneAgent(agent: AgentStatus): AgentStatus {
  return { ...agent };
}

function cloneSessionSummary(session: SessionSummary): SessionSummary {
  return { ...session };
}

function cloneSessionDetail(session: SessionDetail): SessionDetail {
  return {
    ...session,
    messages: session.messages.map(cloneSessionMessage)
  };
}

function cloneSessionMessage(message: SessionMessage): SessionMessage {
  return { ...message };
}
