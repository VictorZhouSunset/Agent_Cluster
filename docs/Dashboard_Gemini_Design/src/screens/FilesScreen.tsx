import { apiClient } from '../apiClient';
import NodeScopedDocumentsScreen from '../components/NodeScopedDocumentsScreen';

export default function FilesScreen() {
  return (
    <NodeScopedDocumentsScreen
      title="Files"
      fetchDocuments={apiClient.getFiles}
      updateDocument={apiClient.updateFile}
    />
  );
}
