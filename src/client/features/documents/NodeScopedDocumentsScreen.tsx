// input: cluster node inventory plus node-aware document API callbacks for one document kind
// output: reusable node selector wrapped around the shared editable-documents workspace
// pos: client-side bridge that scopes files and skills screens to local or remote nodes
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
  editorTitle: string;
  emptyMessage: string;
  loadingCollectionMessage: string;
  loadingDetailMessage: string;
  idleDetailMessage: string;
  loadCollectionErrorPrefix: string;
  loadDetailErrorPrefix: string;
  saveErrorPrefix: string;
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
  editorTitle,
  emptyMessage,
  loadingCollectionMessage,
  loadingDetailMessage,
  idleDetailMessage,
  loadCollectionErrorPrefix,
  loadDetailErrorPrefix,
  saveErrorPrefix,
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
    <div style={{ display: "grid", gap: "1rem" }}>
      <section
        style={{
          marginTop: "2rem",
          display: "grid",
          gap: "0.5rem"
        }}
      >
        <label htmlFor={`${kind}-node-select`}>
          <strong>Node</strong>
        </label>
        <select
          id={`${kind}-node-select`}
          value={selectedNodeId ?? ""}
          disabled={nodesState.status !== "success" || availableNodes.length < 2}
          onChange={(event) => setSelectedNodeId(event.target.value)}
          style={{
            maxWidth: "22rem",
            borderRadius: "0.75rem",
            border: "1px solid #cbd5e1",
            padding: "0.65rem 0.8rem",
            backgroundColor: "#ffffff"
          }}
        >
          {availableNodes.map((node) => (
            <option key={node.id} value={node.id}>
              {node.name}
            </option>
          ))}
        </select>
        {nodesState.status === "loading" ? <p>Loading nodes...</p> : null}
        {nodesState.status === "error" ? (
          <p role="alert">Unable to load nodes: {nodesState.message}</p>
        ) : null}
      </section>

      <EditableDocumentsScreen
        key={selectedNode?.id ?? "local"}
        collectionTitle={collectionTitle}
        editorTitle={editorTitle}
        emptyMessage={emptyMessage}
        loadingCollectionMessage={loadingCollectionMessage}
        loadingDetailMessage={loadingDetailMessage}
        idleDetailMessage={idleDetailMessage}
        loadCollectionErrorPrefix={loadCollectionErrorPrefix}
        loadDetailErrorPrefix={loadDetailErrorPrefix}
        saveErrorPrefix={saveErrorPrefix}
        listDocuments={() => listDocuments(apiNodeId)}
        readDocument={(documentId) => readDocument(documentId, apiNodeId)}
        saveDocument={(documentId, content) =>
          saveDocument(documentId, content, apiNodeId)
        }
      />
    </div>
  );
}
