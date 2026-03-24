import { apiClient } from '../apiClient';
import NodeScopedDocumentsScreen from '../components/NodeScopedDocumentsScreen';

export default function SkillsScreen() {
  return (
    <NodeScopedDocumentsScreen
      title="Skills"
      fetchDocuments={apiClient.getSkills}
      updateDocument={apiClient.updateSkill}
    />
  );
}
