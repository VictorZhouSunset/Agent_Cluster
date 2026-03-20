// input: editable document ids for fixed markdown files or skill markdown paths
// output: validated relative filesystem targets within the dashboard allowlist
// pos: filesystem guard that constrains which documents the dashboard may edit
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import type { EditableDocumentId } from "../../../shared/types.js";
import {
  BUNDLED_SKILL_SCOPE,
  EDITABLE_MARKDOWN_PATHS,
  isFixedEditableDocumentId,
  MANAGED_SKILL_SCOPE,
  SKILL_ID_PREFIX,
  SKILL_NAME_PATTERN,
  WORKSPACE_SKILL_SCOPE
} from "./constants.js";

export interface EditableTarget {
  documentId: EditableDocumentId;
  kind: "file" | "skill";
  name: string;
  relativePath: string;
}

function isAllowedSkillName(skillName: string) {
  return SKILL_NAME_PATTERN.test(skillName);
}

export function getSkillDisplayName(skillName: string, scope: string) {
  if (scope === MANAGED_SKILL_SCOPE) {
    return `${skillName} (managed)`;
  }

  if (scope === WORKSPACE_SKILL_SCOPE) {
    return `${skillName} (workspace)`;
  }

  return skillName;
}

export function parseSkillDocumentId(documentId: EditableDocumentId) {
  if (!documentId.startsWith(SKILL_ID_PREFIX)) {
    throw new Error(`Editable document id "${documentId}" is not allowlisted.`);
  }

  const rawSkillId = documentId.slice(SKILL_ID_PREFIX.length);
  const segments = rawSkillId.split(":");
  const hasExplicitScope = segments.length > 1 && segments[0] !== "";
  const scope = hasExplicitScope ? segments[0] : WORKSPACE_SKILL_SCOPE;
  const skillName = hasExplicitScope ? segments.slice(1).join(":") : rawSkillId;

  if (
    ![BUNDLED_SKILL_SCOPE, MANAGED_SKILL_SCOPE, WORKSPACE_SKILL_SCOPE].includes(scope) ||
    !isAllowedSkillName(skillName)
  ) {
    throw new Error(`Editable document id "${documentId}" is not allowlisted.`);
  }

  return {
    scope,
    skillName
  };
}

export function resolveEditableTarget(documentId: EditableDocumentId): EditableTarget {
  if (isFixedEditableDocumentId(documentId)) {
    return {
      documentId,
      kind: "file",
      name: EDITABLE_MARKDOWN_PATHS[documentId].split("/").at(-1) ?? EDITABLE_MARKDOWN_PATHS[documentId],
      relativePath: EDITABLE_MARKDOWN_PATHS[documentId]
    };
  }

  if (!documentId.startsWith(SKILL_ID_PREFIX)) {
    throw new Error(`Editable document id "${documentId}" is not allowlisted.`);
  }

  const { scope, skillName } = parseSkillDocumentId(documentId);

  if (![MANAGED_SKILL_SCOPE, WORKSPACE_SKILL_SCOPE].includes(scope)) {
    throw new Error(`Editable document id "${documentId}" is not allowlisted.`);
  }

  const relativePath =
    scope === MANAGED_SKILL_SCOPE
      ? `.openclaw/skills/${skillName}/SKILL.md`
      : `.openclaw/workspace/skills/${skillName}/SKILL.md`;

  return {
    documentId: `${SKILL_ID_PREFIX}${scope}:${skillName}`,
    kind: "skill",
    name: getSkillDisplayName(skillName, scope),
    relativePath
  };
}
