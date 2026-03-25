// input: remote adapter base URL, shared secret, timeout settings, and node-aware dashboard document requests
// output: typed HTTP client calls for remote node summaries, agent data, and document operations with bounded wait time
// pos: cluster adapter client used by the agent_1 dashboard backend
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import type {
  AgentStatus,
  ClusterNode,
  EditableDocument,
  EditableDocumentContent
} from "../../../shared/types.js";
import type {
  RemoteDashboardAdapterClient,
  RemoteDashboardAdapterClientOptions,
  RemoteDocumentRequest,
  RemoteDocumentWriteRequest
} from "./types.js";

type AdapterSuccess<T> = {
  data: T;
};

type AdapterFailure = {
  error?: {
    code?: string;
    message?: string;
  };
};

function withNodeQuery(path: string, nodeId: string) {
  const url = new URL(path, "http://dashboard-adapter.local");
  url.searchParams.set("node", nodeId);
  return `${url.pathname}${url.search}`;
}

function withDocumentPath(path: string, documentId: string, nodeId: string) {
  return withNodeQuery(`${path}/${encodeURIComponent(documentId)}`, nodeId);
}

async function requestJson<T>(
  baseUrl: string,
  secret: string,
  timeoutMs: number,
  path: string,
  init?: RequestInit
): Promise<T> {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(new URL(path, baseUrl), {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "X-Dashboard-Secret": secret,
        ...(init?.headers ?? {})
      }
    });

    const payload = (await response.json()) as AdapterSuccess<T> & AdapterFailure;

    if (!response.ok || !("data" in payload)) {
      throw new Error(
        payload.error?.message ?? `Remote adapter request failed with status ${response.status}.`
      );
    }

    return payload.data;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`Remote adapter request timed out after ${timeoutMs}ms.`);
    }

    throw error;
  } finally {
    clearTimeout(timeoutHandle);
  }
}

export function createRemoteDashboardAdapterClient({
  baseUrl,
  secret,
  timeoutMs = 1500
}: RemoteDashboardAdapterClientOptions): RemoteDashboardAdapterClient {
  return {
    async listNodes(): Promise<ClusterNode[]> {
      return requestJson<ClusterNode[]>(baseUrl, secret, timeoutMs, "/dashboard/nodes");
    },
    async listAgents(): Promise<AgentStatus[]> {
      return requestJson<AgentStatus[]>(baseUrl, secret, timeoutMs, "/dashboard/agents");
    },
    async listDocuments({
      kind,
      nodeId
    }): Promise<EditableDocument[]> {
      return requestJson<EditableDocument[]>(
        baseUrl,
        secret,
        timeoutMs,
        withNodeQuery(`/dashboard/documents/${kind}`, nodeId)
      );
    },
    async readDocument({
      documentId,
      kind,
      nodeId
    }: RemoteDocumentRequest): Promise<EditableDocumentContent> {
      return requestJson<EditableDocumentContent>(
        baseUrl,
        secret,
        timeoutMs,
        withDocumentPath(`/dashboard/documents/${kind}`, documentId, nodeId)
      );
    },
    async writeDocument({
      documentId,
      kind,
      nodeId,
      content
    }: RemoteDocumentWriteRequest): Promise<EditableDocumentContent> {
      return requestJson<EditableDocumentContent>(
        baseUrl,
        secret,
        timeoutMs,
        withDocumentPath(`/dashboard/documents/${kind}`, documentId, nodeId),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ content })
        }
      );
    }
  };
}
