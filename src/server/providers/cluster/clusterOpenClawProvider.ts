// input: local dashboard runtime provider plus an optional remote adapter client
// output: cluster-aware health, node, and agent reads that preserve local session ownership and current cluster naming
// pos: aggregation layer between local OpenClaw data and remote cluster summaries
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import type {
  AgentStatus,
  ClusterNode,
  DashboardHealth,
  HealthState
} from "../../../shared/types.js";
import type { OpenClawProvider } from "../openclaw/types.js";
import type { RemoteDashboardAdapterClient } from "./types.js";

export interface CreateClusterOpenClawProviderOptions {
  localProvider: OpenClawProvider;
  remoteAdapterClient?: RemoteDashboardAdapterClient;
}

function mergeHealthStates(left: HealthState, right: HealthState): HealthState {
  const rank: Record<HealthState, number> = {
    healthy: 0,
    degraded: 1,
    offline: 2
  };

  return rank[left] >= rank[right] ? left : right;
}

function summarizeNodes(nodes: ClusterNode[]) {
  const healthyCount = nodes.filter((node) => node.status === "healthy").length;
  const degradedCount = nodes.filter((node) => node.status === "degraded").length;
  const offlineCount = nodes.filter((node) => node.status === "offline").length;

  const detailParts = [
    `${healthyCount} healthy`,
    degradedCount > 0 ? `${degradedCount} degraded` : null,
    offlineCount > 0 ? `${offlineCount} offline` : null
  ].filter(Boolean);

  return `${nodes.length} nodes connected (${detailParts.join(", ")}).`;
}

function getPrimaryLocalNode(localNodes: ClusterNode[]) {
  return (
    localNodes[0] ?? {
      id: "openmoose03-cio",
      name: "OpenMoose03_CIO",
      kind: "gate",
      origin: "local",
      status: "healthy",
      checkedAt: new Date().toISOString(),
      summary: "Local dashboard node.",
      supportsSessions: true,
      supportsSkills: true,
      supportsFiles: true,
      supportsWrites: true
    }
  );
}

function withNodeMetadata(agent: AgentStatus, node: ClusterNode): AgentStatus {
  return {
    ...agent,
    nodeId: agent.nodeId ?? node.id,
    nodeName: agent.nodeName ?? node.name
  };
}

export function createClusterOpenClawProvider({
  localProvider,
  remoteAdapterClient
}: CreateClusterOpenClawProviderOptions): OpenClawProvider {
  return {
    async getHealth(): Promise<DashboardHealth> {
      const [localHealth, localNodes] = await Promise.all([
        localProvider.getHealth(),
        localProvider.listNodes()
      ]);

      if (!remoteAdapterClient) {
        return localHealth;
      }

      try {
        const remoteNodes = await remoteAdapterClient.listNodes();
        const combinedNodes = [...localNodes, ...remoteNodes];
        const overallStatus = combinedNodes.reduce(
          (currentStatus, node) => mergeHealthStates(currentStatus, node.status),
          localHealth.status
        );

        return {
          status: overallStatus,
          checkedAt: new Date().toISOString(),
          summary: summarizeNodes(combinedNodes)
        };
      } catch (error) {
        return {
          status: mergeHealthStates(localHealth.status, "degraded"),
          checkedAt: new Date().toISOString(),
          summary: `Local dashboard data is available, but the remote adapter is unavailable: ${
            error instanceof Error ? error.message : "unknown error"
          }.`
        };
      }
    },

    async listNodes(): Promise<ClusterNode[]> {
      const localNodes = await localProvider.listNodes();

      if (!remoteAdapterClient) {
        return localNodes;
      }

      try {
        const remoteNodes = await remoteAdapterClient.listNodes();
        return [...localNodes, ...remoteNodes];
      } catch {
        return localNodes;
      }
    },

    async listAgents(): Promise<AgentStatus[]> {
      const [localAgents, localNodes] = await Promise.all([
        localProvider.listAgents(),
        localProvider.listNodes()
      ]);
      const localNode = getPrimaryLocalNode(localNodes);
      const normalizedLocalAgents = localAgents.map((agent) =>
        withNodeMetadata(agent, localNode)
      );

      if (!remoteAdapterClient) {
        return normalizedLocalAgents;
      }

      try {
        const remoteAgents = await remoteAdapterClient.listAgents();
        return [...normalizedLocalAgents, ...remoteAgents];
      } catch {
        return normalizedLocalAgents;
      }
    },

    async listSessions() {
      return localProvider.listSessions();
    },

    async getSession(sessionId: string) {
      return localProvider.getSession(sessionId);
    }
  };
}
