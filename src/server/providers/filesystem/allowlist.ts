// input: editable document ids for fixed markdown files or skill markdown paths
// output: validated relative filesystem targets within the dashboard allowlist
// pos: filesystem guard that constrains which documents the dashboard may edit
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import type { EditableDocumentId } from "../../../shared/types.js";
import {
  EDITABLE_MARKDOWN_PATHS,
  isFixedEditableDocumentId,
  SKILL_ID_PREFIX,
  SKILL_NAME_PATTERN
} from "./constants.js";

export interface EditableTarget {
  relativePath: string;
}

export function resolveEditableTarget(documentId: EditableDocumentId): EditableTarget {
  if (isFixedEditableDocumentId(documentId)) {
    return { relativePath: EDITABLE_MARKDOWN_PATHS[documentId] };
  }

  if (!documentId.startsWith(SKILL_ID_PREFIX)) {
    throw new Error(`Editable document id "${documentId}" is not allowlisted.`);
  }

  const skillName = documentId.slice(SKILL_ID_PREFIX.length);
  if (!SKILL_NAME_PATTERN.test(skillName)) {
    throw new Error(`Editable document id "${documentId}" is not allowlisted.`);
  }

  return { relativePath: `skills/${skillName}/SKILL.md` };
}
