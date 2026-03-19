// input: OpenClaw home-directory base path plus allowlisted document ids from route handlers
// output: local editable document lists, reads, and writes constrained to safe OpenClaw paths
// pos: concrete filesystem provider used by the dashboard backend
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import { access, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { EditableDocument, EditableDocumentContent, EditableDocumentId } from "../../../shared/types.js";
import {
  EDITABLE_MARKDOWN_PATHS,
  MANAGED_SKILL_SCOPE,
  SKILL_ID_PREFIX,
  WORKSPACE_SKILL_SCOPE
} from "./constants.js";
import { resolveEditableTarget } from "./allowlist.js";
import type {
  EditableDocumentQuery,
  FilesystemProvider,
  ReadEditableDocumentOptions,
  UpdateEditableDocumentInput
} from "./types.js";

function isDefined<T>(value: T | null): value is T {
  return value !== null;
}

function isSkillDocumentId(documentId: EditableDocumentId) {
  return documentId.startsWith(SKILL_ID_PREFIX);
}

function isAbsentError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

async function createDocumentContent(rootDir: string, documentId: EditableDocumentId): Promise<EditableDocumentContent> {
  const target = resolveEditableTarget(documentId);
  const { relativePath } = target;
  const absolutePath = join(rootDir, relativePath);
  const [content, fileStats] = await Promise.all([
    readFile(absolutePath, "utf8"),
    stat(absolutePath)
  ]);

  return {
    id: target.documentId,
    name: target.name,
    path: absolutePath,
    kind: target.kind,
    updatedAt: fileStats.mtime.toISOString(),
    content
  };
}

async function listSkillDocumentsInScope(
  rootDir: string,
  scope: typeof MANAGED_SKILL_SCOPE | typeof WORKSPACE_SKILL_SCOPE
): Promise<EditableDocument[]> {
  const skillsDir =
    scope === MANAGED_SKILL_SCOPE
      ? join(rootDir, ".openclaw", "skills")
      : join(rootDir, ".openclaw", "workspace", "skills");

  try {
    const entries = await readdir(skillsDir, { withFileTypes: true });
    const skills = await Promise.all(entries.filter((entry) => entry.isDirectory()).map(async (entry) => {
      const documentId = `${SKILL_ID_PREFIX}${scope}:${entry.name}`;

      try {
        const target = resolveEditableTarget(documentId);
        const absolutePath = join(rootDir, target.relativePath);
        const fileStats = await stat(absolutePath);

        return {
          id: target.documentId,
          name: target.name,
          path: absolutePath,
          kind: "skill",
          updatedAt: fileStats.mtime.toISOString()
        } satisfies EditableDocument;
      } catch (error) {
        if (error instanceof Error && /not allowlisted/i.test(error.message)) {
          return null;
        }

        if (isAbsentError(error)) {
          return null;
        }

        throw error;
      }
    }));

    return skills.filter(isDefined).sort((left, right) => left.id.localeCompare(right.id));
  } catch (error) {
    if (isAbsentError(error)) {
      return [];
    }

    throw error;
  }
}

async function listSkillDocuments(rootDir: string): Promise<EditableDocument[]> {
  const [managedSkills, workspaceSkills] = await Promise.all([
    listSkillDocumentsInScope(rootDir, MANAGED_SKILL_SCOPE),
    listSkillDocumentsInScope(rootDir, WORKSPACE_SKILL_SCOPE)
  ]);
  return [...managedSkills, ...workspaceSkills].sort((left, right) => left.id.localeCompare(right.id));
}

async function getFileDocument(rootDir: string, documentId: EditableDocumentId, relativePath: string) {
  try {
    const absolutePath = join(rootDir, relativePath);
    const fileStats = await stat(absolutePath);

    return {
      id: documentId,
      name: relativePath.split("/").at(-1) ?? relativePath,
      path: absolutePath,
      kind: "file",
      updatedAt: fileStats.mtime.toISOString()
    } satisfies EditableDocument;
  } catch (error) {
    if (isAbsentError(error)) {
      return null;
    }

    throw error;
  }
}

export function createLocalFilesystemProvider(rootDir: string): FilesystemProvider {
  async function listDocuments() {
    const fixedDocuments = await Promise.all(
      Object.entries(EDITABLE_MARKDOWN_PATHS).map(([documentId, relativePath]) =>
        getFileDocument(rootDir, documentId, relativePath)
      )
    );
    const skillDocuments = await listSkillDocuments(rootDir);

    return [...fixedDocuments.filter(isDefined), ...skillDocuments];
  }

  async function readDocument(documentId: EditableDocumentId) {
    return createDocumentContent(rootDir, documentId);
  }

  async function writeDocument(documentId: EditableDocumentId, content: string) {
    const { relativePath } = resolveEditableTarget(documentId);
    const absolutePath = join(rootDir, relativePath);

    await access(join(rootDir));
    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, content, "utf8");

    return createDocumentContent(rootDir, documentId);
  }

  async function listEditableDocuments(_query?: EditableDocumentQuery) {
    return listDocuments();
  }

  async function readEditableDocument(
    documentId: EditableDocumentId,
    _options?: ReadEditableDocumentOptions
  ) {
    return readDocument(documentId);
  }

  async function writeEditableDocument(input: UpdateEditableDocumentInput) {
    return writeDocument(input.id, input.content);
  }

  return {
    listDocuments,
    readDocument,
    writeDocument,
    listEditableDocuments,
    readEditableDocument,
    writeEditableDocument
  };
}
