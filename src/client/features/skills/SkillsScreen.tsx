// input: skill document list/detail/save requests from the shared API client
// output: rendered skill workspace for browsing and editing allowlisted skills per node with source-grouped bundled, managed, and workspace sections
// pos: skills feature entrypoint built on the node-scoped document workspace
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import { apiClient } from "../../lib/apiClient";
import { NodeScopedDocumentsScreen } from "../documents/NodeScopedDocumentsScreen";

export function SkillsScreen() {
  return (
    <NodeScopedDocumentsScreen
      kind="skill"
      collectionTitle="Skills"
      listDescription="Bundled ready skills are shown read-only. Managed and workspace skills remain editable."
      emptyMessage="No skills found."
      loadingCollectionMessage="Loading skills..."
      loadingDetailMessage="Loading skill content..."
      idleDetailMessage="Select a skill to view its content."
      loadCollectionErrorPrefix="Unable to load skills"
      loadDetailErrorPrefix="Unable to load skill"
      saveErrorPrefix="Unable to save skill"
      groupDocumentsBySource
      listDocuments={apiClient.listSkills}
      readDocument={apiClient.getSkill}
      saveDocument={apiClient.saveSkill}
    />
  );
}
