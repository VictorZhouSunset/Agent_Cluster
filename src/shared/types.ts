// input: normalized dashboard domain concepts shared by client and server code
// output: shared TypeScript contracts for cluster nodes, health, sessions, agents, and documents
// pos: cross-layer type definitions for the Gate dashboard codebase
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
export const dashboardSections = ["overview", "sessions", "skills", "files"] as const;

export type DashboardSection = (typeof dashboardSections)[number];

export type HealthState = "healthy" | "degraded" | "offline";

export interface DashboardHealth {
  status: HealthState;
  checkedAt: string;
  summary?: string;
}

export type ClusterNodeKind = "gate" | "md" | "other";
export type ClusterNodeOrigin = "local" | "remote";

export interface ClusterNode {
  id: string;
  name: string;
  kind: ClusterNodeKind;
  origin: ClusterNodeOrigin;
  status: HealthState;
  checkedAt: string;
  summary?: string;
  supportsSessions: boolean;
  supportsSkills: boolean;
  supportsFiles: boolean;
  supportsWrites: boolean;
}

export type AgentLifecycleStatus = "idle" | "running" | "error" | "offline";

export interface AgentStatus {
  id: string;
  name: string;
  status: AgentLifecycleStatus;
  summary?: string;
  updatedAt?: string;
  nodeId?: string;
  nodeName?: string;
}

export type SessionState = "active" | "idle" | "completed" | "error";

export interface SessionSummary {
  id: string;
  title: string;
  updatedAt: string;
  startedAt?: string;
  status?: SessionState;
  agentId?: string;
  agentName?: string;
  nodeId?: string;
  nodeName?: string;
}

export type SessionMessageRole = "system" | "user" | "assistant" | "tool";

export interface SessionMessage {
  id: string;
  role: SessionMessageRole;
  content: string;
  createdAt: string;
}

export interface SessionDetail extends SessionSummary {
  messages: SessionMessage[];
}

export type EditableDocumentKind = "file" | "skill";
export type EditableDocumentId = string;
export type EditableDocumentSource = "fixed" | "bundled" | "managed" | "workspace";

export interface EditableDocument {
  id: EditableDocumentId;
  name: string;
  path: string;
  kind: EditableDocumentKind;
  source?: EditableDocumentSource;
  editable?: boolean;
  updatedAt?: string;
}

export interface EditableDocumentContent extends EditableDocument {
  content: string;
}
