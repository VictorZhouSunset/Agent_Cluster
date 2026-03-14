// input: skill document list/detail/save requests from the shared API client
// output: rendered skill workspace for browsing and editing allowlisted skills
// pos: skills feature entrypoint built on the shared editable-documents workspace
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import { apiClient } from "../../lib/apiClient";
import { EditableDocumentsScreen } from "../documents/EditableDocumentsScreen";

export function SkillsScreen() {
  return (
    <EditableDocumentsScreen
      collectionTitle="Skills"
      editorTitle="Skill Editor"
      emptyMessage="No skills found."
      loadingCollectionMessage="Loading skills..."
      loadingDetailMessage="Loading skill content..."
      idleDetailMessage="Select a skill to view its content."
      loadCollectionErrorPrefix="Unable to load skills"
      loadDetailErrorPrefix="Unable to load skill"
      saveErrorPrefix="Unable to save skill"
      listDocuments={apiClient.listSkills}
      readDocument={apiClient.getSkill}
      saveDocument={apiClient.saveSkill}
    />
  );
}
