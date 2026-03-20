// input: a local OpenClaw home directory plus an agent id for one runtime session store
// output: normalized session summaries and transcript messages read from sessions.json and jsonl transcripts
// pos: filesystem-backed session adapter used by the local OpenClaw provider
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import type {
  SessionDetail,
  SessionMessage,
  SessionMessageRole,
  SessionState,
  SessionSummary
} from "../../../shared/types.js";
import type { LocalOpenClawAdapter } from "./types.js";

type FilesystemSessionStoreOptions = {
  homeDir: string;
  agentId?: string;
};

type SessionIndexRecord = Record<string, unknown>;
type SessionIndexStore = Record<string, SessionIndexRecord>;

const DEFAULT_AGENT_ID = "main";
const DEFAULT_AGENT_NAME = "OpenMoose03_CIO Agent";
const DEFAULT_NODE_ID = "openmoose03-cio";
const DEFAULT_NODE_NAME = "OpenMoose03_CIO";

function getSessionsDir(homeDir: string, agentId: string) {
  return join(homeDir, ".openclaw", "agents", agentId, "sessions");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeTimestamp(value: unknown, fallback?: string) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const timestamp = Date.parse(value);

    if (!Number.isNaN(timestamp)) {
      return new Date(timestamp).toISOString();
    }
  }

  return fallback;
}

function normalizeSessionState(value: unknown): SessionState | undefined {
  if (value === "active" || value === "idle" || value === "completed" || value === "error") {
    return value;
  }

  return undefined;
}

function normalizeMessageRole(value: unknown): SessionMessageRole | null {
  if (value === "system" || value === "user" || value === "assistant" || value === "tool") {
    return value;
  }

  if (typeof value === "string" && value.toLowerCase().includes("tool")) {
    return "tool";
  }

  return null;
}

function flattenContent(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => flattenContent(item))
      .filter((item) => item.length > 0)
      .join("\n\n");
  }

  if (isRecord(value)) {
    if (typeof value.text === "string") {
      return value.text.trim();
    }

    if (typeof value.content === "string") {
      return value.content.trim();
    }

    if (Array.isArray(value.content)) {
      return flattenContent(value.content);
    }
  }

  return "";
}

function buildSessionSummary(
  sessionKey: string,
  sessionRecord: SessionIndexRecord,
  agentId: string,
  fallbackUpdatedAt: string,
  fallbackStartedAt?: string
): SessionSummary {
  const sessionIdCandidate =
    typeof sessionRecord.sessionId === "string"
      ? sessionRecord.sessionId
      : typeof sessionRecord.id === "string"
        ? sessionRecord.id
        : sessionKey;
  const titleCandidate =
    typeof sessionRecord.displayName === "string"
      ? sessionRecord.displayName
      : typeof sessionRecord.title === "string"
        ? sessionRecord.title
        : sessionKey === DEFAULT_AGENT_ID
          ? "Main session"
          : sessionKey;
  const updatedAt =
    normalizeTimestamp(sessionRecord.updatedAt, fallbackUpdatedAt) ?? fallbackUpdatedAt;
  const startedAt = normalizeTimestamp(
    sessionRecord.createdAt ?? sessionRecord.startedAt,
    fallbackStartedAt
  );
  const status = normalizeSessionState(sessionRecord.status);

  return {
    id: sessionIdCandidate,
    title: titleCandidate,
    updatedAt,
    startedAt,
    status,
    agentId,
    agentName: DEFAULT_AGENT_NAME,
    nodeId: DEFAULT_NODE_ID,
    nodeName: DEFAULT_NODE_NAME
  };
}

async function readSessionIndex(
  homeDir: string,
  agentId: string
): Promise<Array<{ key: string; record: SessionIndexRecord; transcriptMtime: string }>> {
  const sessionsDir = getSessionsDir(homeDir, agentId);
  const indexPath = join(sessionsDir, "sessions.json");

  try {
    const raw = await readFile(indexPath, "utf8");
    const parsed = JSON.parse(raw);

    if (!isRecord(parsed)) {
      return [];
    }

    const entries = Object.entries(parsed as SessionIndexStore);
    const records = await Promise.all(
      entries
        .filter(([, value]) => isRecord(value))
        .map(async ([key, value]) => {
          const sessionId =
            typeof value.sessionId === "string"
              ? value.sessionId
              : typeof value.id === "string"
                ? value.id
                : key;
          const transcriptPath = join(sessionsDir, `${sessionId}.jsonl`);
          const transcriptStats = await stat(transcriptPath);

          return {
            key,
            record: value,
            transcriptMtime: transcriptStats.mtime.toISOString()
          };
        })
    );

    return records.sort((left, right) =>
      right.transcriptMtime.localeCompare(left.transcriptMtime)
    );
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

function createMessage(
  sessionId: string,
  lineRecord: Record<string, unknown>,
  index: number,
  fallbackTimestamp: string
): SessionMessage | null {
  const nestedMessage = isRecord(lineRecord.message) ? lineRecord.message : null;
  const role =
    normalizeMessageRole(lineRecord.role) ?? normalizeMessageRole(nestedMessage?.role);

  if (!role) {
    return null;
  }

  const content = flattenContent(lineRecord.content) || flattenContent(nestedMessage?.content);

  if (!content) {
    return null;
  }

  const createdAt =
    normalizeTimestamp(
      lineRecord.createdAt ?? lineRecord.timestamp ?? nestedMessage?.createdAt ?? nestedMessage?.timestamp,
      fallbackTimestamp
    ) ?? fallbackTimestamp;

  return {
    id:
      (typeof lineRecord.id === "string" && lineRecord.id) ||
      (typeof nestedMessage?.id === "string" && nestedMessage.id) ||
      `${sessionId}:message:${index + 1}`,
    role,
    content,
    createdAt
  };
}

async function readTranscriptMessages(
  homeDir: string,
  agentId: string,
  sessionId: string,
  fallbackTimestamp: string
) {
  const transcriptPath = join(getSessionsDir(homeDir, agentId), `${sessionId}.jsonl`);

  try {
    const raw = await readFile(transcriptPath, "utf8");
    return raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        try {
          return JSON.parse(line) as unknown;
        } catch {
          return null;
        }
      })
      .flatMap((line, index) => {
        if (!isRecord(line)) {
          return [];
        }

        const message = createMessage(sessionId, line, index, fallbackTimestamp);
        return message ? [message] : [];
      });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

export function createFilesystemSessionAdapter({
  homeDir,
  agentId = DEFAULT_AGENT_ID
}: FilesystemSessionStoreOptions): Pick<LocalOpenClawAdapter, "listSessions" | "getSession"> {
  async function listSessions() {
    const records = await readSessionIndex(homeDir, agentId);

    return records.map(({ key, record, transcriptMtime }) =>
      buildSessionSummary(key, record, agentId, transcriptMtime)
    );
  }

  async function getSession(sessionId: string): Promise<SessionDetail | null> {
    const records = await readSessionIndex(homeDir, agentId);
    const matchedRecord = records.find(({ key, record }) => {
      return record.sessionId === sessionId || record.id === sessionId || key === sessionId;
    });

    if (!matchedRecord) {
      return null;
    }

    const summary = buildSessionSummary(
      matchedRecord.key,
      matchedRecord.record,
      agentId,
      matchedRecord.transcriptMtime
    );
    const messages = await readTranscriptMessages(
      homeDir,
      agentId,
      summary.id,
      summary.updatedAt
    );

    if (!messages) {
      return null;
    }

    return {
      ...summary,
      messages
    };
  }

  return {
    listSessions,
    getSession
  };
}
