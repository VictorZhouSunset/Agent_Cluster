// input: local OpenClaw runtime data and optional adapter implementations
// output: provider and adapter contracts for normalized dashboard state reads
// pos: OpenClaw provider interface boundary for the backend
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import type {
  AgentStatus,
  DashboardHealth,
  SessionDetail,
  SessionSummary
} from "../../../shared/types.js";

export interface OpenClawProvider {
  getHealth(): Promise<DashboardHealth>;
  listAgents(): Promise<AgentStatus[]>;
  listSessions(): Promise<SessionSummary[]>;
  getSession(sessionId: string): Promise<SessionDetail | null>;
}

export interface LocalOpenClawAdapter {
  readHealth(): Promise<DashboardHealth>;
  listAgents(): Promise<AgentStatus[]>;
  listSessions(): Promise<SessionSummary[]>;
  getSession(sessionId: string): Promise<SessionDetail | null>;
}

export interface CreateLocalOpenClawProviderOptions {
  adapter?: LocalOpenClawAdapter;
}
