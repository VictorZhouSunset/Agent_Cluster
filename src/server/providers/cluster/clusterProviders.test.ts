// input: stubbed local providers, remote adapter responses, and node-aware document requests
// output: assertions for cluster-aware provider composition across local and remote nodes
// pos: provider-level tests for the cluster aggregation layer
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import { describe, expect, it, vi } from "vitest";
import type {
  AgentStatus,
  ClusterNode,
  DashboardHealth,
  EditableDocument,
  EditableDocumentContent,
  SessionDetail,
  SessionSummary
} from "../../../shared/types.js";
import type { FilesystemProvider } from "../filesystem/types.js";
import type { OpenClawProvider } from "../openclaw/types.js";
import type { RemoteDashboardAdapterClient } from "./types.js";
import { createClusterFilesystemProvider } from "./clusterFilesystemProvider.js";
import { createClusterOpenClawProvider } from "./clusterOpenClawProvider.js";

function createLocalOpenClawProviderStub(overrides?: {
  health?: DashboardHealth;
  agents?: AgentStatus[];
  sessions?: SessionSummary[];
  session?: SessionDetail | null;
  nodes?: ClusterNode[];
}): OpenClawProvider {
  const health =
    overrides?.health ??
    ({
      status: "healthy",
      checkedAt: "2026-03-16T00:00:00.000Z",
      summary: "Local node healthy."
    } satisfies DashboardHealth);
  const agents =
    overrides?.agents ??
    ([
      {
        id: "agent-gate",
        name: "Gate Node Agent",
        status: "idle",
        summary: "Local agent idle."
      }
    ] satisfies AgentStatus[]);
  const sessions =
    overrides?.sessions ??
    ([
      {
        id: "session-local-1",
        title: "Local Session",
        updatedAt: "2026-03-16T00:00:00.000Z",
        status: "active"
      }
    ] satisfies SessionSummary[]);
  const session =
    overrides?.session ??
    ({
      id: "session-local-1",
      title: "Local Session",
      updatedAt: "2026-03-16T00:00:00.000Z",
      status: "active",
      messages: []
    } satisfies SessionDetail);
  const nodes =
    overrides?.nodes ??
    ([
      {
        id: "agent-1",
        name: "Gate Node",
        kind: "gate",
        origin: "local",
        status: "healthy",
        checkedAt: "2026-03-16T00:00:00.000Z",
        summary: "Local node healthy.",
        supportsSessions: true,
        supportsSkills: true,
        supportsFiles: true,
        supportsWrites: true
      }
    ] satisfies ClusterNode[]);

  return {
    async getHealth() {
      return { ...health };
    },
    async listAgents() {
      return agents.map((agent) => ({ ...agent }));
    },
    async listSessions() {
      return sessions.map((sessionItem) => ({ ...sessionItem }));
    },
    async getSession(sessionId: string) {
      return sessionId === session?.id ? { ...session, messages: [...session.messages] } : null;
    },
    async listNodes() {
      return nodes.map((node) => ({ ...node }));
    }
  };
}

function createLocalFilesystemProviderStub(overrides?: {
  list?: EditableDocument[];
  read?: EditableDocumentContent;
  write?: EditableDocumentContent;
}): FilesystemProvider {
  const listed =
    overrides?.list ??
    ([
      {
        id: "agents-md",
        name: "AGENTS.md",
        path: "AGENTS.md",
        kind: "file"
      }
    ] satisfies EditableDocument[]);
  const readDocument =
    overrides?.read ??
    ({
      id: "agents-md",
      name: "AGENTS.md",
      path: "AGENTS.md",
      kind: "file",
      content: "# Agents"
    } satisfies EditableDocumentContent);
  const writtenDocument =
    overrides?.write ??
    ({
      ...readDocument,
      content: "# Updated Agents"
    } satisfies EditableDocumentContent);

  return {
    async listDocuments() {
      return listed.map((document) => ({ ...document }));
    },
    async readDocument() {
      return { ...readDocument };
    },
    async writeDocument() {
      return { ...writtenDocument };
    },
    async listEditableDocuments() {
      return listed.map((document) => ({ ...document }));
    },
    async readEditableDocument() {
      return { ...readDocument };
    },
    async writeEditableDocument() {
      return { ...writtenDocument };
    }
  };
}

function createRemoteAdapterStub(overrides?: {
  nodes?: ClusterNode[];
  agents?: AgentStatus[];
  documents?: EditableDocument[];
  document?: EditableDocumentContent;
}): RemoteDashboardAdapterClient {
  const nodes =
    overrides?.nodes ??
    ([
      {
        id: "agent-2",
        name: "OpenMoose02_MD",
        kind: "md",
        origin: "remote",
        status: "healthy",
        checkedAt: "2026-03-16T00:00:00.000Z",
        summary: "Coordinator healthy.",
        supportsSessions: false,
        supportsSkills: true,
        supportsFiles: true,
        supportsWrites: true
      }
    ] satisfies ClusterNode[]);
  const agents =
    overrides?.agents ??
    ([
      {
        id: "agent-md",
        name: "OpenMoose02_MD",
        status: "running",
        summary: "Queue depth 1",
        nodeId: "agent-2",
        nodeName: "OpenMoose02_MD"
      }
    ] satisfies AgentStatus[]);
  const documents =
    overrides?.documents ??
    ([
      {
        id: "skill:software-dev",
        name: "software-dev",
        path: "skills/software-dev/SKILL.md",
        kind: "skill"
      }
    ] satisfies EditableDocument[]);
  const document =
    overrides?.document ??
    ({
      id: "skill:software-dev",
      name: "software-dev",
      path: "skills/software-dev/SKILL.md",
      kind: "skill",
      content: "# Remote Skill"
    } satisfies EditableDocumentContent);

  return {
    async listNodes() {
      return nodes.map((node) => ({ ...node }));
    },
    async listAgents() {
      return agents.map((agent) => ({ ...agent }));
    },
    async listDocuments() {
      return documents.map((item) => ({ ...item }));
    },
    async readDocument() {
      return { ...document };
    },
    async writeDocument(input) {
      return { ...document, content: input.content };
    }
  };
}

describe("cluster OpenClaw provider", () => {
  it("combines local and remote nodes, agents, and health summaries", async () => {
    const provider = createClusterOpenClawProvider({
      localProvider: createLocalOpenClawProviderStub(),
      remoteAdapterClient: createRemoteAdapterStub()
    });

    await expect(provider.listNodes()).resolves.toEqual([
      expect.objectContaining({ id: "agent-1", origin: "local" }),
      expect.objectContaining({ id: "agent-2", origin: "remote" })
    ]);
    await expect(provider.listAgents()).resolves.toEqual([
      expect.objectContaining({ id: "agent-gate", nodeId: "agent-1" }),
      expect.objectContaining({ id: "agent-md", nodeId: "agent-2" })
    ]);
    await expect(provider.listSessions()).resolves.toEqual([
      expect.objectContaining({ id: "session-local-1" })
    ]);

    await expect(provider.getHealth()).resolves.toEqual(
      expect.objectContaining({
        status: "healthy",
        summary: expect.stringContaining("2 nodes")
      })
    );
  });

  it("keeps local data available when the remote adapter is unavailable", async () => {
    const provider = createClusterOpenClawProvider({
      localProvider: createLocalOpenClawProviderStub(),
      remoteAdapterClient: {
        listNodes: vi.fn(async () => {
          throw new Error("adapter unavailable");
        }),
        listAgents: vi.fn(async () => {
          throw new Error("adapter unavailable");
        }),
        listDocuments: vi.fn(),
        readDocument: vi.fn(),
        writeDocument: vi.fn()
      }
    });

    await expect(provider.listNodes()).resolves.toEqual([
      expect.objectContaining({ id: "agent-1", origin: "local" })
    ]);
    await expect(provider.listAgents()).resolves.toEqual([
      expect.objectContaining({ id: "agent-gate", nodeId: "agent-1" })
    ]);
    await expect(provider.getHealth()).resolves.toEqual(
      expect.objectContaining({
        status: "degraded",
        summary: expect.stringContaining("adapter unavailable")
      })
    );
  });
});

describe("cluster filesystem provider", () => {
  it("reads and writes local documents when no node id is provided", async () => {
    const provider = createClusterFilesystemProvider({
      localProvider: createLocalFilesystemProviderStub(),
      remoteAdapterClient: createRemoteAdapterStub()
    });

    await expect(provider.listEditableDocuments()).resolves.toEqual([
      expect.objectContaining({ id: "agents-md", kind: "file" })
    ]);
    await expect(provider.readEditableDocument("agents-md")).resolves.toEqual(
      expect.objectContaining({ content: "# Agents" })
    );
    await expect(
      provider.writeEditableDocument({ id: "agents-md", content: "# Updated Agents" })
    ).resolves.toEqual(expect.objectContaining({ content: "# Updated Agents" }));
  });

  it("routes remote document operations through the adapter when a node id is provided", async () => {
    const remoteAdapterClient = createRemoteAdapterStub();
    const provider = createClusterFilesystemProvider({
      localProvider: createLocalFilesystemProviderStub(),
      remoteAdapterClient
    });

    await expect(
      provider.listEditableDocuments({ nodeId: "agent-2", kind: "skill" })
    ).resolves.toEqual([
      expect.objectContaining({ id: "skill:software-dev", kind: "skill" })
    ]);
    await expect(
      provider.readEditableDocument("skill:software-dev", { nodeId: "agent-2", kind: "skill" })
    ).resolves.toEqual(expect.objectContaining({ content: "# Remote Skill" }));
    await expect(
      provider.writeEditableDocument({
        id: "skill:software-dev",
        nodeId: "agent-2",
        kind: "skill",
        content: "# Updated Remote Skill"
      })
    ).resolves.toEqual(expect.objectContaining({ content: "# Updated Remote Skill" }));
  });

  it("rejects remote requests when no adapter is configured", async () => {
    const provider = createClusterFilesystemProvider({
      localProvider: createLocalFilesystemProviderStub()
    });

    await expect(
      provider.listEditableDocuments({ nodeId: "agent-2", kind: "file" })
    ).rejects.toThrow(/remote adapter/i);
  });
});
