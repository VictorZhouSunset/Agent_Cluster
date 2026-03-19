// input: browser fetch requests and server JSON envelopes for dashboard resources
// output: typed client-side API methods for local and remote-node dashboard resources
// pos: client data access layer between React screens and the internal backend
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import type {
  AgentStatus,
  ClusterNode,
  DashboardHealth,
  EditableDocument,
  EditableDocumentContent,
  SessionDetail,
  SessionSummary
} from "../../shared/types";

type ApiSuccess<T> = {
  data: T;
};

type ApiFailure = {
  error: {
    code: string;
    message: string;
  };
};

export class ApiClientError extends Error {
  code: string;

  constructor(message: string, code = "unknown_error") {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
  }
}

function isApiFailure(payload: unknown): payload is ApiFailure {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "object" &&
    payload.error !== null &&
    "message" in payload.error &&
    typeof payload.error.message === "string"
  );
}

function isApiSuccess<T>(payload: unknown): payload is ApiSuccess<T> {
  return typeof payload === "object" && payload !== null && "data" in payload;
}

function normalizeSkillDocumentId(documentId: string) {
  return documentId.startsWith("skill:")
    ? documentId.slice("skill:".length)
    : documentId;
}

function normalizeSkillDocument<T extends EditableDocument | EditableDocumentContent>(
  document: T
): T {
  return {
    ...document,
    id: normalizeSkillDocumentId(document.id)
  };
}

function toSkillRouteId(documentId: string) {
  return documentId.startsWith("skill:") ? documentId.slice("skill:".length) : documentId;
}

function withNodeQuery(path: string, nodeId?: string) {
  if (!nodeId) {
    return path;
  }

  const url = new URL(path, "http://dashboard.local");
  url.searchParams.set("node", nodeId);
  return `${url.pathname}${url.search}`;
}

async function getJson<T>(path: string): Promise<T> {
  return requestJson<T>(path);
}

async function putJson<T>(path: string, body: unknown): Promise<T> {
  return requestJson<T>(path, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(path, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.headers ?? {})
      }
    });

    const rawBody = await response.text();
    let payload: unknown = null;

    if (rawBody.trim().length > 0) {
      try {
        payload = JSON.parse(rawBody);
      } catch {
        // Some backend failures can return an empty or non-JSON body; treat those
        // the same way as any other unknown API failure.
        payload = null;
      }
    }

    if (!response.ok || !isApiSuccess<T>(payload)) {
      const error = isApiFailure(payload)
        ? payload.error
        : { code: "unknown_error", message: "Request failed." };

      throw new ApiClientError(error.message, error.code);
    }

    return payload.data;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }

    throw new ApiClientError(
      error instanceof Error ? error.message : "Request failed."
    );
  }
}

export const apiClient = {
  getHealth() {
    return getJson<DashboardHealth>("/api/health");
  },
  getAgents() {
    return getJson<AgentStatus[]>("/api/agents");
  },
  getNodes() {
    return getJson<ClusterNode[]>("/api/nodes");
  },
  listSessions() {
    return getJson<SessionSummary[]>("/api/sessions");
  },
  getSession(sessionId: string) {
    return getJson<SessionDetail>(`/api/sessions/${encodeURIComponent(sessionId)}`);
  },
  async listSkills(nodeId?: string) {
    const documents = await getJson<EditableDocument[]>(
      withNodeQuery("/api/skills", nodeId)
    );
    // The backend lists skill ids as `skill:<name>`, but the route layer expects
    // only the `<name>` segment for detail and save endpoints.
    return documents.map((document) => normalizeSkillDocument(document));
  },
  async getSkill(documentId: string, nodeId?: string) {
    const document = await getJson<EditableDocumentContent>(
      withNodeQuery(
        `/api/skills/${encodeURIComponent(toSkillRouteId(documentId))}`,
        nodeId
      )
    );
    return normalizeSkillDocument(document);
  },
  async saveSkill(documentId: string, content: string, nodeId?: string) {
    const document = await putJson<EditableDocumentContent>(
      withNodeQuery(
        `/api/skills/${encodeURIComponent(toSkillRouteId(documentId))}`,
        nodeId
      ),
      { content }
    );
    return normalizeSkillDocument(document);
  },
  listFiles(nodeId?: string) {
    return getJson<EditableDocument[]>(withNodeQuery("/api/files", nodeId));
  },
  getFile(documentId: string, nodeId?: string) {
    return getJson<EditableDocumentContent>(
      withNodeQuery(`/api/files/${encodeURIComponent(documentId)}`, nodeId)
    );
  },
  saveFile(documentId: string, content: string, nodeId?: string) {
    return putJson<EditableDocumentContent>(
      withNodeQuery(`/api/files/${encodeURIComponent(documentId)}`, nodeId),
      { content }
    );
  }
};
