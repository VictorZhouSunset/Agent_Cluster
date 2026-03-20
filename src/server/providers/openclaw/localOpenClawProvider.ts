// input: local OpenClaw-facing adapter hooks, local session-store settings, and fallback stub data
// output: normalized dashboard health, node, agent, and session data for backend routes using current cluster naming
// pos: local OpenClaw provider implementation used by the dashboard backend
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import type {
  AgentStatus,
  ClusterNode,
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
import { createFilesystemSessionAdapter } from "./localSessionStore.js";

const stubHealth: DashboardHealth = {
  status: "healthy",
  checkedAt: "2026-03-12T00:00:00.000Z",
  summary: "Local OpenClaw stub is responding."
};

const stubAgents: AgentStatus[] = [
  {
    id: "agent-gate",
    name: "OpenMoose03_CIO Agent",
    status: "idle",
    summary: "Stubbed local agent status.",
    updatedAt: "2026-03-12T00:00:00.000Z",
    nodeId: "openmoose03-cio",
    nodeName: "OpenMoose03_CIO"
  }
];

const stubNodes: ClusterNode[] = [
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
];

const stubSessionSummaries: SessionSummary[] = [
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
  const adapter = options.adapter ?? createDefaultAdapter(options);

  return {
    async getHealth(): Promise<DashboardHealth> {
      return cloneHealth(await adapter.readHealth());
    },
    async listNodes(): Promise<ClusterNode[]> {
      const nodes = await adapter.listNodes();
      return nodes.map(cloneNode);
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

function createDefaultAdapter(
  options: CreateLocalOpenClawProviderOptions
): LocalOpenClawAdapter {
  const sessionAdapter = options.homeDir
    ? createFilesystemSessionAdapter({
        homeDir: options.homeDir,
        agentId: options.agentId
      })
    : null;

  return {
    async readHealth() {
      return cloneHealth(stubHealth);
    },
    async listNodes() {
      return stubNodes.map(cloneNode);
    },
    async listAgents() {
      return stubAgents.map(cloneAgent);
    },
    async listSessions() {
      if (sessionAdapter) {
        return sessionAdapter.listSessions();
      }

      return stubSessionSummaries.map(cloneSessionSummary);
    },
    async getSession(sessionId: string) {
      if (sessionAdapter) {
        return sessionAdapter.getSession(sessionId);
      }

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

function cloneNode(node: ClusterNode): ClusterNode {
  return { ...node };
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
