// input: process environment, fallback filesystem root, topology flags, and local provider factories
// output: configured dashboard providers with topology-aware optional remote adapter composition
// pos: provider bootstrap helper for server startup and tests
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import { createLocalFilesystemProvider } from "../filesystem/localFilesystemProvider.js";
import type { FilesystemProvider } from "../filesystem/types.js";
import { createLocalOpenClawProvider } from "../openclaw/localOpenClawProvider.js";
import type { OpenClawProvider } from "../openclaw/types.js";
import { createClusterFilesystemProvider } from "./clusterFilesystemProvider.js";
import { createClusterOpenClawProvider } from "./clusterOpenClawProvider.js";
import { createRemoteDashboardAdapterClient } from "./remoteDashboardAdapterClient.js";

export interface ClusterEnvironment {
  GATE_CLUSTER_TOPOLOGY?: string;
  GATE_CLUSTER_ADAPTER_BASE_URL?: string;
  GATE_CLUSTER_ADAPTER_SECRET?: string;
  GATE_CLUSTER_ADAPTER_TIMEOUT_MS?: string;
  GATE_OPENCLAW_BASE_DIR?: string;
  GATE_OPENCLAW_AGENT_ID?: string;
  HOME?: string;
}

export interface ConfiguredProviders {
  filesystemProvider: FilesystemProvider;
  openClawProvider: OpenClawProvider;
}

function createRemoteAdapterClient(env: ClusterEnvironment) {
  if (env.GATE_CLUSTER_TOPOLOGY === "tier0") {
    return undefined;
  }

  if (!env.GATE_CLUSTER_ADAPTER_BASE_URL || !env.GATE_CLUSTER_ADAPTER_SECRET) {
    return undefined;
  }

  return createRemoteDashboardAdapterClient({
    baseUrl: env.GATE_CLUSTER_ADAPTER_BASE_URL,
    secret: env.GATE_CLUSTER_ADAPTER_SECRET,
    timeoutMs: Number(env.GATE_CLUSTER_ADAPTER_TIMEOUT_MS || 1500)
  });
}

export function createConfiguredProviders(
  rootDir: string,
  env: ClusterEnvironment = process.env
): ConfiguredProviders {
  const remoteAdapterClient = createRemoteAdapterClient(env);
  const openClawHomeDir = env.GATE_OPENCLAW_BASE_DIR ?? env.HOME ?? rootDir;
  const localFilesystemProvider = createLocalFilesystemProvider(openClawHomeDir);
  const localOpenClawProvider = createLocalOpenClawProvider({
    homeDir: openClawHomeDir,
    agentId: env.GATE_OPENCLAW_AGENT_ID
  });

  return {
    filesystemProvider: createClusterFilesystemProvider({
      localProvider: localFilesystemProvider,
      remoteAdapterClient
    }),
    openClawProvider: createClusterOpenClawProvider({
      localProvider: localOpenClawProvider,
      remoteAdapterClient
    })
  };
}
