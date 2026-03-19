// input: workspace root path plus allowlisted document ids from route handlers
// output: local editable document lists, reads, and writes constrained to safe paths
// pos: concrete filesystem provider used by the dashboard backend
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import { access, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { EditableDocument, EditableDocumentContent, EditableDocumentId } from "../../../shared/types.js";
import { EDITABLE_MARKDOWN_PATHS, SKILL_ID_PREFIX } from "./constants.js";
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

function getDocumentName(documentId: EditableDocumentId, relativePath: string) {
  if (isSkillDocumentId(documentId)) {
    return documentId.slice(SKILL_ID_PREFIX.length);
  }

  return relativePath;
}

async function createDocumentContent(rootDir: string, documentId: EditableDocumentId): Promise<EditableDocumentContent> {
  const { relativePath } = resolveEditableTarget(documentId);
  const absolutePath = join(rootDir, relativePath);
  const [content, fileStats] = await Promise.all([
    readFile(absolutePath, "utf8"),
    stat(absolutePath)
  ]);

  return {
    id: documentId,
    name: getDocumentName(documentId, relativePath),
    path: relativePath,
    kind: isSkillDocumentId(documentId) ? "skill" : "file",
    updatedAt: fileStats.mtime.toISOString(),
    content
  };
}

async function listSkillDocuments(rootDir: string): Promise<EditableDocument[]> {
  const skillsDir = join(rootDir, "skills");

  try {
    const entries = await readdir(skillsDir, { withFileTypes: true });
    const skills = await Promise.all(entries.filter((entry) => entry.isDirectory()).map(async (entry) => {
      const documentId = `${SKILL_ID_PREFIX}${entry.name}`;

      try {
        // Reuse allowlist resolution so skill discovery and direct reads share
        // the same validation rules.
        const { relativePath } = resolveEditableTarget(documentId);
        const absolutePath = join(rootDir, relativePath);
        const fileStats = await stat(absolutePath);

        return {
          id: documentId,
          name: entry.name,
          path: relativePath,
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

async function getFileDocument(rootDir: string, documentId: EditableDocumentId, relativePath: string) {
  try {
    const fileStats = await stat(join(rootDir, relativePath));

    return {
      id: documentId,
      name: relativePath,
      path: relativePath,
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

    if (isSkillDocumentId(documentId)) {
      await mkdir(join(rootDir, "skills", documentId.slice(SKILL_ID_PREFIX.length)), { recursive: true });
    }

    await access(join(rootDir));
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
