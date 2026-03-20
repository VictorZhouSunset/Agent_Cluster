// input: OpenClaw home-directory base path plus allowlisted document ids from route handlers
// output: local editable document lists, reads, and writes constrained to safe OpenClaw paths with bundled-ready skill discovery
// pos: concrete filesystem provider used by the dashboard backend
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import { execFile } from "node:child_process";
import { access, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { promisify } from "node:util";
import type {
  EditableDocument,
  EditableDocumentContent,
  EditableDocumentId,
  EditableDocumentSource
} from "../../../shared/types.js";
import {
  BUNDLED_SKILL_SCOPE,
  EDITABLE_MARKDOWN_PATHS,
  MANAGED_SKILL_SCOPE,
  SKILL_ID_PREFIX,
  WORKSPACE_SKILL_SCOPE
} from "./constants.js";
import {
  getSkillDisplayName,
  parseSkillDocumentId,
  resolveEditableTarget
} from "./allowlist.js";
import type {
  EditableDocumentQuery,
  FilesystemProvider,
  ReadEditableDocumentOptions,
  UpdateEditableDocumentInput
} from "./types.js";

const execFileAsync = promisify(execFile);

type SkillScope =
  | typeof BUNDLED_SKILL_SCOPE
  | typeof MANAGED_SKILL_SCOPE
  | typeof WORKSPACE_SKILL_SCOPE;

type BundledSkillRecord = {
  name: string;
  path: string;
};

type BundledSkillCatalog = {
  listReadySkills: () => Promise<BundledSkillRecord[]>;
};

type LocalFilesystemProviderOptions = {
  bundledSkillCatalog?: BundledSkillCatalog;
};

export class ReadOnlyDocumentError extends Error {
  constructor(documentId: string) {
    super(`Document "${documentId}" is read-only.`);
    this.name = "ReadOnlyDocumentError";
  }
}

function isDefined<T>(value: T | null): value is T {
  return value !== null;
}

function isSkillDocumentId(documentId: EditableDocumentId) {
  return documentId.startsWith(SKILL_ID_PREFIX);
}

function isBundledSkillDocumentId(documentId: EditableDocumentId) {
  if (!isSkillDocumentId(documentId)) {
    return false;
  }

  return parseSkillDocumentId(documentId).scope === BUNDLED_SKILL_SCOPE;
}

function isAbsentError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

function createSkillDocument(
  skillName: string,
  source: EditableDocumentSource,
  path: string,
  updatedAt: string
): EditableDocument {
  return {
    id: `${SKILL_ID_PREFIX}${source}:${skillName}`,
    name: getSkillDisplayName(skillName, source),
    path,
    kind: "skill",
    source,
    editable: source !== BUNDLED_SKILL_SCOPE,
    updatedAt
  };
}

async function createBundledSkillContent(
  documentId: EditableDocumentId,
  bundledSkills: BundledSkillRecord[]
): Promise<EditableDocumentContent> {
  const { skillName } = parseSkillDocumentId(documentId);
  const target = bundledSkills.find((skill) => skill.name === skillName);

  if (!target) {
    throw new Error(`Editable document id "${documentId}" is not allowlisted.`);
  }

  const [content, fileStats] = await Promise.all([
    readFile(target.path, "utf8"),
    stat(target.path)
  ]);

  return {
    ...createSkillDocument(skillName, BUNDLED_SKILL_SCOPE, target.path, fileStats.mtime.toISOString()),
    content
  };
}

async function createDocumentContent(
  rootDir: string,
  documentId: EditableDocumentId,
  bundledSkillCatalog: BundledSkillCatalog
): Promise<EditableDocumentContent> {
  if (isBundledSkillDocumentId(documentId)) {
    return createBundledSkillContent(documentId, await bundledSkillCatalog.listReadySkills());
  }

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
    source:
      target.kind === "file"
        ? "fixed"
        : (parseSkillDocumentId(documentId).scope as Exclude<SkillScope, "bundled">),
    editable: true,
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
          ...createSkillDocument(entry.name, scope, absolutePath, fileStats.mtime.toISOString())
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

function parseReadyBundledSkillNames(output: string) {
  const names = new Set<string>();

  for (const line of output.split(/\r?\n/)) {
    if (!line.includes("│")) {
      continue;
    }

    const cells = line
      .split("│")
      .map((cell) => cell.trim())
      .filter((cell, index, allCells) => !(index === 0 && cell === "") && !(index === allCells.length - 1 && cell === ""));

    if (cells.length < 4) {
      continue;
    }

    const [status, skillCell, , source] = cells;

    if (source !== "openclaw-bundled" || !status.includes("ready")) {
      continue;
    }

    const skillName = skillCell.match(/[A-Za-z0-9][A-Za-z0-9._-]*/)?.[0];

    if (skillName) {
      names.add(skillName);
    }
  }

  return [...names];
}

async function resolveOpenClawInstallDir() {
  const configuredInstallDir =
    process.env.DASHBOARD_OPENCLAW_INSTALL_DIR ?? process.env.OPENCLAW_INSTALL_DIR;

  if (configuredInstallDir) {
    return resolve(configuredInstallDir);
  }

  const configuredExecutable =
    process.env.DASHBOARD_OPENCLAW_EXECUTABLE ?? process.env.OPENCLAW_EXECUTABLE;

  try {
    const executablePath = configuredExecutable
      ? configuredExecutable
      : (
          await execFileAsync(process.platform === "win32" ? "where" : "which", [
            "openclaw"
          ])
        ).stdout.split(/\r?\n/)[0]?.trim();

    if (!executablePath) {
      return null;
    }

    return resolve(dirname(executablePath), "..", "lib", "node_modules", "openclaw");
  } catch {
    return null;
  }
}

async function createDefaultBundledSkillCatalog(): Promise<BundledSkillCatalog> {
  const installDir = await resolveOpenClawInstallDir();
  const executablePath =
    process.env.DASHBOARD_OPENCLAW_EXECUTABLE ??
    process.env.OPENCLAW_EXECUTABLE ??
    "openclaw";

  return {
    async listReadySkills() {
      if (!installDir) {
        return [];
      }

      try {
        const { stdout } = await execFileAsync(executablePath, ["skills", "list", "--eligible"], {
          env: process.env
        });
        const readyNames = parseReadyBundledSkillNames(stdout);
        const documents = await Promise.all(
          readyNames.map(async (skillName) => {
            const path = join(installDir, "skills", skillName, "SKILL.md");

            try {
              await stat(path);
              return {
                name: skillName,
                path
              } satisfies BundledSkillRecord;
            } catch {
              return null;
            }
          })
        );

        return documents.filter(isDefined);
      } catch {
        return [];
      }
    }
  };
}

async function listSkillDocuments(
  rootDir: string,
  bundledSkillCatalog: BundledSkillCatalog
): Promise<EditableDocument[]> {
  const [bundledSkills, managedSkills, workspaceSkills] = await Promise.all([
    bundledSkillCatalog.listReadySkills(),
    listSkillDocumentsInScope(rootDir, MANAGED_SKILL_SCOPE),
    listSkillDocumentsInScope(rootDir, WORKSPACE_SKILL_SCOPE)
  ]);
  const bundledDocuments = await Promise.all(
    bundledSkills.map(async (skill) => {
      const fileStats = await stat(skill.path);
      return createSkillDocument(
        skill.name,
        BUNDLED_SKILL_SCOPE,
        skill.path,
        fileStats.mtime.toISOString()
      );
    })
  );
  return [...bundledDocuments, ...managedSkills, ...workspaceSkills].sort((left, right) =>
    left.id.localeCompare(right.id)
  );
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
      source: "fixed",
      editable: true,
      updatedAt: fileStats.mtime.toISOString()
    } satisfies EditableDocument;
  } catch (error) {
    if (isAbsentError(error)) {
      return null;
    }

    throw error;
  }
}

export function createLocalFilesystemProvider(
  rootDir: string,
  options: LocalFilesystemProviderOptions = {}
): FilesystemProvider {
  let bundledSkillCatalogPromise: Promise<BundledSkillCatalog> | null = null;

  function getBundledSkillCatalog() {
    bundledSkillCatalogPromise ??=
      options.bundledSkillCatalog !== undefined
        ? Promise.resolve(options.bundledSkillCatalog)
        : createDefaultBundledSkillCatalog();

    return bundledSkillCatalogPromise;
  }

  async function listDocuments() {
    const fixedDocuments = await Promise.all(
      Object.entries(EDITABLE_MARKDOWN_PATHS).map(([documentId, relativePath]) =>
        getFileDocument(rootDir, documentId, relativePath)
      )
    );
    const skillDocuments = await listSkillDocuments(rootDir, await getBundledSkillCatalog());

    return [...fixedDocuments.filter(isDefined), ...skillDocuments];
  }

  async function readDocument(documentId: EditableDocumentId) {
    return createDocumentContent(rootDir, documentId, await getBundledSkillCatalog());
  }

  async function writeDocument(documentId: EditableDocumentId, content: string) {
    if (isBundledSkillDocumentId(documentId)) {
      throw new ReadOnlyDocumentError(documentId);
    }

    const { relativePath } = resolveEditableTarget(documentId);
    const absolutePath = join(rootDir, relativePath);

    await access(join(rootDir));
    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, content, "utf8");

    return createDocumentContent(rootDir, documentId, await getBundledSkillCatalog());
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
