// input: local filesystem provider, optional remote adapter client, and node-scoped document requests
// output: filesystem reads and writes routed either locally or through the remote adapter
// pos: document access bridge for local gate files and remote cluster documents
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import type {
  EditableDocument,
  EditableDocumentContent,
  EditableDocumentKind,
  EditableDocumentId
} from "../../../shared/types.js";
import type {
  EditableDocumentQuery,
  FilesystemProvider,
  ReadEditableDocumentOptions,
  UpdateEditableDocumentInput
} from "../filesystem/types.js";
import type { RemoteDashboardAdapterClient } from "./types.js";

export interface CreateClusterFilesystemProviderOptions {
  localProvider: FilesystemProvider;
  remoteAdapterClient?: RemoteDashboardAdapterClient;
}

function requireRemoteAdapter(remoteAdapterClient?: RemoteDashboardAdapterClient) {
  if (!remoteAdapterClient) {
    throw new Error("Remote adapter is not configured for this dashboard.");
  }

  return remoteAdapterClient;
}

function requireDocumentKind(
  documentKind: EditableDocumentKind | undefined,
  operationLabel: string
): EditableDocumentKind {
  if (!documentKind) {
    throw new Error(`${operationLabel} requires a document kind.`);
  }

  return documentKind;
}

export function createClusterFilesystemProvider({
  localProvider,
  remoteAdapterClient
}: CreateClusterFilesystemProviderOptions): FilesystemProvider {
  async function listDocuments(): Promise<EditableDocument[]> {
    return localProvider.listDocuments();
  }

  async function readDocument(documentId: EditableDocumentId): Promise<EditableDocumentContent> {
    return localProvider.readDocument(documentId);
  }

  async function writeDocument(
    documentId: EditableDocumentId,
    content: string
  ): Promise<EditableDocumentContent> {
    return localProvider.writeDocument(documentId, content);
  }

  async function listEditableDocuments(
    query?: EditableDocumentQuery
  ): Promise<EditableDocument[]> {
    if (!query?.nodeId) {
      const documents = await localProvider.listEditableDocuments(query);
      return query?.kind
        ? documents.filter((document) => document.kind === query.kind)
        : documents;
    }

    const adapter = requireRemoteAdapter(remoteAdapterClient);
    const kind = requireDocumentKind(query.kind, "Remote document listing");
    return adapter.listDocuments({
      kind,
      nodeId: query.nodeId
    });
  }

  async function readEditableDocument(
    documentId: EditableDocumentId,
    options?: ReadEditableDocumentOptions
  ): Promise<EditableDocumentContent> {
    if (!options?.nodeId) {
      return localProvider.readEditableDocument(documentId, options);
    }

    const adapter = requireRemoteAdapter(remoteAdapterClient);
    return adapter.readDocument({
      documentId,
      kind: requireDocumentKind(options.kind, "Remote document read"),
      nodeId: options.nodeId
    });
  }

  async function writeEditableDocument(
    input: UpdateEditableDocumentInput
  ): Promise<EditableDocumentContent> {
    if (!input.nodeId) {
      return localProvider.writeEditableDocument(input);
    }

    const adapter = requireRemoteAdapter(remoteAdapterClient);
    return adapter.writeDocument({
      documentId: input.id,
      kind: requireDocumentKind(input.kind, "Remote document write"),
      nodeId: input.nodeId,
      content: input.content
    });
  }

  return {
    listDocuments,
    readDocument,
    writeDocument,
    listEditableDocuments,
    readEditableDocument,
    writeEditableDocument
  };
}
