// input: remote dashboard adapter base URL, secret config, and node-aware document operations
// output: contracts for the agent_1 backend to read cluster summaries and proxy remote documents
// pos: shared interface boundary for cluster-aware adapter integrations
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import type {
  AgentStatus,
  ClusterNode,
  EditableDocument,
  EditableDocumentContent,
  EditableDocumentId,
  EditableDocumentKind
} from "../../../shared/types.js";

export interface RemoteDocumentRequest {
  documentId: EditableDocumentId;
  kind: EditableDocumentKind;
  nodeId: string;
}

export interface RemoteDocumentWriteRequest extends RemoteDocumentRequest {
  content: string;
}

export interface RemoteDashboardAdapterClient {
  listNodes(): Promise<ClusterNode[]>;
  listAgents(): Promise<AgentStatus[]>;
  listDocuments(input: {
    kind: EditableDocumentKind;
    nodeId: string;
  }): Promise<EditableDocument[]>;
  readDocument(input: RemoteDocumentRequest): Promise<EditableDocumentContent>;
  writeDocument(input: RemoteDocumentWriteRequest): Promise<EditableDocumentContent>;
}

export interface RemoteDashboardAdapterClientOptions {
  baseUrl: string;
  secret: string;
  timeoutMs?: number;
}
