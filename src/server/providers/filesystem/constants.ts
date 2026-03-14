// input: static allowlist metadata for editable markdown files and skill ids
// output: shared filesystem constants used by the document allowlist and provider
// pos: configuration module for editable filesystem scope
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import type { EditableDocumentId } from "../../../shared/types.js";

type FixedEditableDocumentPaths = {
  "agents-md": "AGENTS.md";
  "soul-md": "SOUL.md";
  "tools-md": "TOOLS.md";
  "user-md": "USER.md";
};

export const EDITABLE_MARKDOWN_PATHS = Object.freeze({
  "agents-md": "AGENTS.md",
  "soul-md": "SOUL.md",
  "tools-md": "TOOLS.md",
  "user-md": "USER.md"
} as const satisfies FixedEditableDocumentPaths);

export type FixedEditableDocumentId = keyof typeof EDITABLE_MARKDOWN_PATHS;
export function isFixedEditableDocumentId(documentId: EditableDocumentId): documentId is FixedEditableDocumentId {
  return Object.hasOwn(EDITABLE_MARKDOWN_PATHS, documentId);
}

export const SKILL_ID_PREFIX = "skill:";
export const SKILL_NAME_PATTERN = /^(?!\.{1,2}$)[A-Za-z0-9._-]+$/;
