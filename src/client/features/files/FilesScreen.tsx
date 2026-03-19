// input: file document list/detail/save requests from the shared API client
// output: rendered file workspace for browsing and editing allowlisted markdown files per node
// pos: files feature entrypoint built on the node-scoped document workspace
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import { apiClient } from "../../lib/apiClient";
import { NodeScopedDocumentsScreen } from "../documents/NodeScopedDocumentsScreen";

export function FilesScreen() {
  return (
    <NodeScopedDocumentsScreen
      kind="file"
      collectionTitle="Files"
      editorTitle="File Editor"
      emptyMessage="No files found."
      loadingCollectionMessage="Loading files..."
      loadingDetailMessage="Loading file content..."
      idleDetailMessage="Select a file to view its content."
      loadCollectionErrorPrefix="Unable to load files"
      loadDetailErrorPrefix="Unable to load file"
      saveErrorPrefix="Unable to save file"
      listDocuments={apiClient.listFiles}
      readDocument={apiClient.getFile}
      saveDocument={apiClient.saveFile}
    />
  );
}
