// input: cluster node inventory plus node-aware document API callbacks for one document kind
// output: styled node selector wrapper around the shared editable-documents workspace
// pos: client-side bridge that scopes file and skill editing to local or remote nodes
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import { useEffect, useMemo, useState } from "react";
import type {
  ClusterNode,
  EditableDocument,
  EditableDocumentContent
} from "../../../shared/types";
import { apiClient } from "../../lib/apiClient";
import { EditableDocumentsScreen } from "./EditableDocumentsScreen";

type NodeScopedDocumentsScreenProps = {
  kind: "file" | "skill";
  collectionTitle: string;
  listDescription?: string;
  emptyMessage: string;
  loadingCollectionMessage: string;
  loadingDetailMessage: string;
  idleDetailMessage: string;
  loadCollectionErrorPrefix: string;
  loadDetailErrorPrefix: string;
  saveErrorPrefix: string;
  groupDocumentsBySource?: boolean;
  listDocuments: (nodeId?: string) => Promise<EditableDocument[]>;
  readDocument: (
    documentId: string,
    nodeId?: string
  ) => Promise<EditableDocumentContent>;
  saveDocument: (
    documentId: string,
    content: string,
    nodeId?: string
  ) => Promise<EditableDocumentContent>;
};

type NodesState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; nodes: ClusterNode[] };

function supportsDocumentKind(node: ClusterNode, kind: "file" | "skill") {
  return kind === "file" ? node.supportsFiles : node.supportsSkills;
}

function toApiNodeId(node: ClusterNode | undefined) {
  if (!node || node.origin === "local") {
    return undefined;
  }

  return node.id;
}

export function NodeScopedDocumentsScreen({
  kind,
  collectionTitle,
  listDescription,
  emptyMessage,
  loadingCollectionMessage,
  loadingDetailMessage,
  idleDetailMessage,
  loadCollectionErrorPrefix,
  loadDetailErrorPrefix,
  saveErrorPrefix,
  groupDocumentsBySource = false,
  listDocuments,
  readDocument,
  saveDocument
}: NodeScopedDocumentsScreenProps) {
  const [nodesState, setNodesState] = useState<NodesState>({ status: "loading" });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadNodes() {
      try {
        const nodes = (await apiClient.getNodes()).filter((node) =>
          supportsDocumentKind(node, kind)
        );

        if (!isActive) {
          return;
        }

        setNodesState({ status: "success", nodes });
        setSelectedNodeId((currentId) => currentId ?? nodes[0]?.id ?? null);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setNodesState({
          status: "error",
          message:
            error instanceof Error ? error.message : "Unable to load nodes."
        });
      }
    }

    void loadNodes();

    return () => {
      isActive = false;
    };
  }, [kind]);

  const availableNodes = nodesState.status === "success" ? nodesState.nodes : [];
  const selectedNode = useMemo(
    () => availableNodes.find((node) => node.id === selectedNodeId),
    [availableNodes, selectedNodeId]
  );
  const apiNodeId = toApiNodeId(selectedNode);

  return (
    <div className="documents-toolbar">
      <section className="panel panel--soft">
        <div className="panel__body documents-toolbar">
        <label htmlFor={`${kind}-node-select`}>
          <strong className="panel__title">Node</strong>
        </label>
        <select
          className="node-select"
          id={`${kind}-node-select`}
          value={selectedNodeId ?? ""}
          disabled={nodesState.status !== "success" || availableNodes.length < 2}
          onChange={(event) => setSelectedNodeId(event.target.value)}
        >
          {availableNodes.map((node) => (
            <option key={node.id} value={node.id}>
              {node.name}
            </option>
          ))}
        </select>
        {nodesState.status === "loading" ? <p className="loading-copy">Loading nodes...</p> : null}
        {nodesState.status === "error" ? (
          <p className="error-copy" role="alert">Unable to load nodes: {nodesState.message}</p>
        ) : null}
        </div>
      </section>

      <EditableDocumentsScreen
        key={selectedNode?.id ?? "local"}
        collectionTitle={collectionTitle}
        listDescription={listDescription}
        emptyMessage={emptyMessage}
        loadingCollectionMessage={loadingCollectionMessage}
        loadingDetailMessage={loadingDetailMessage}
        idleDetailMessage={idleDetailMessage}
        loadCollectionErrorPrefix={loadCollectionErrorPrefix}
        loadDetailErrorPrefix={loadDetailErrorPrefix}
        saveErrorPrefix={saveErrorPrefix}
        groupDocumentsBySource={groupDocumentsBySource}
        listDocuments={() => listDocuments(apiNodeId)}
        readDocument={(documentId) => readDocument(documentId, apiNodeId)}
        saveDocument={(documentId, content) =>
          saveDocument(documentId, content, apiNodeId)
        }
      />
    </div>
  );
}
