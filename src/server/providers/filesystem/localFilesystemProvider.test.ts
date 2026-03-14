import { beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createLocalFilesystemProvider } from "./localFilesystemProvider";

describe("local filesystem provider", () => {
  let rootDir: string;

  beforeEach(async () => {
    rootDir = await mkdtemp(join(tmpdir(), "gate-dashboard-"));
    await mkdir(join(rootDir, "skills", "planner"), { recursive: true });
    await writeFile(join(rootDir, "AGENTS.md"), "# Agents");
    await writeFile(join(rootDir, "skills", "planner", "SKILL.md"), "# Planner");
  });

  it("reads an allowlisted file", async () => {
    const provider = createLocalFilesystemProvider(rootDir);
    const result = await provider.readDocument("agents-md");

    expect(result.id).toBe("agents-md");
    expect(result.kind).toBe("file");
    expect(result.path).toBe("AGENTS.md");
    expect(result.content).toContain("# Agents");
    expect(result.updatedAt).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });

  it("writes an allowlisted skill", async () => {
    const provider = createLocalFilesystemProvider(rootDir);

    await provider.writeDocument("skill:planner", "# Updated");
    const result = await provider.readDocument("skill:planner");

    expect(result.content).toContain("Updated");
  });

  it("lists allowlisted documents with stable ordering and dto fields", async () => {
    await mkdir(join(rootDir, "skills", "alpha"), { recursive: true });
    await writeFile(join(rootDir, "skills", "alpha", "SKILL.md"), "# Alpha");

    const provider = createLocalFilesystemProvider(rootDir);
    const result = await provider.listDocuments();

    expect(result.map((document) => document.id)).toEqual(["agents-md", "skill:alpha", "skill:planner"]);
    expect(result).toEqual([
      expect.objectContaining({
        id: "agents-md",
        kind: "file",
        path: "AGENTS.md",
        updatedAt: expect.stringMatching(/\d{4}-\d{2}-\d{2}T/)
      }),
      expect.objectContaining({
        id: "skill:alpha",
        kind: "skill",
        path: "skills/alpha/SKILL.md",
        updatedAt: expect.stringMatching(/\d{4}-\d{2}-\d{2}T/)
      }),
      expect.objectContaining({
        id: "skill:planner",
        kind: "skill",
        path: "skills/planner/SKILL.md",
        updatedAt: expect.stringMatching(/\d{4}-\d{2}-\d{2}T/)
      })
    ]);
  });

  it("skips invalid skill directories without dropping valid skills", async () => {
    await mkdir(join(rootDir, "skills", "bad name"), { recursive: true });
    await writeFile(join(rootDir, "skills", "bad name", "SKILL.md"), "# Invalid");

    const provider = createLocalFilesystemProvider(rootDir);
    const result = await provider.listDocuments();

    expect(result.map((document) => document.id)).toContain("skill:planner");
    expect(result.map((document) => document.id)).not.toContain("skill:bad name");
  });

  it("rejects non-allowlisted document ids at the provider boundary", async () => {
    const provider = createLocalFilesystemProvider(rootDir);

    await expect(provider.readDocument("unknown-id")).rejects.toThrow(/not allowlisted/i);
  });

  it("treats missing skills directory as empty but surfaces unexpected listing failures", async () => {
    const withoutSkillsRoot = await mkdtemp(join(tmpdir(), "gate-dashboard-no-skills-"));
    await writeFile(join(withoutSkillsRoot, "AGENTS.md"), "# Agents");

    await expect(createLocalFilesystemProvider(withoutSkillsRoot).listDocuments()).resolves.toEqual([
      expect.objectContaining({
        id: "agents-md",
        kind: "file",
        path: "AGENTS.md"
      })
    ]);

    const invalidSkillsRoot = await mkdtemp(join(tmpdir(), "gate-dashboard-invalid-skills-"));
    await writeFile(join(invalidSkillsRoot, "AGENTS.md"), "# Agents");
    await writeFile(join(invalidSkillsRoot, "skills"), "not a directory");

    await expect(createLocalFilesystemProvider(invalidSkillsRoot).listDocuments()).rejects.toMatchObject({
      code: "ENOTDIR"
    });
  });
});
