import { beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createLocalFilesystemProvider } from "./localFilesystemProvider";

describe("local filesystem provider", () => {
  let rootDir: string;
  let workspaceDir: string;
  let managedSkillsDir: string;
  let workspaceSkillsDir: string;

  beforeEach(async () => {
    rootDir = await mkdtemp(join(tmpdir(), "gate-dashboard-"));
    workspaceDir = join(rootDir, ".openclaw", "workspace");
    managedSkillsDir = join(rootDir, ".openclaw", "skills");
    workspaceSkillsDir = join(workspaceDir, "skills");

    await mkdir(join(workspaceSkillsDir, "planner"), { recursive: true });
    await writeFile(join(workspaceDir, "AGENTS.md"), "# Agents");
    await writeFile(join(workspaceSkillsDir, "planner", "SKILL.md"), "# Planner");
  });

  it("reads an allowlisted file", async () => {
    const provider = createLocalFilesystemProvider(rootDir);
    const result = await provider.readDocument("agents-md");

    expect(result.id).toBe("agents-md");
    expect(result.kind).toBe("file");
    expect(result.path).toBe(join(workspaceDir, "AGENTS.md"));
    expect(result.content).toContain("# Agents");
    expect(result.updatedAt).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });

  it("writes an allowlisted skill", async () => {
    const provider = createLocalFilesystemProvider(rootDir);

    await provider.writeDocument("skill:workspace:planner", "# Updated");
    const result = await provider.readDocument("skill:workspace:planner");

    expect(result.content).toContain("Updated");
  });

  it("lists allowlisted documents from the OpenClaw workspace and both skill roots", async () => {
    await mkdir(join(workspaceSkillsDir, "alpha"), { recursive: true });
    await mkdir(join(managedSkillsDir, "reviewer"), { recursive: true });
    await writeFile(join(workspaceSkillsDir, "alpha", "SKILL.md"), "# Alpha");
    await writeFile(join(managedSkillsDir, "reviewer", "SKILL.md"), "# Reviewer");

    const provider = createLocalFilesystemProvider(rootDir);
    const result = await provider.listDocuments();

    expect(result.map((document) => document.id)).toEqual([
      "agents-md",
      "skill:managed:reviewer",
      "skill:workspace:alpha",
      "skill:workspace:planner"
    ]);
    expect(result).toEqual([
      expect.objectContaining({
        id: "agents-md",
        kind: "file",
        path: join(workspaceDir, "AGENTS.md"),
        updatedAt: expect.stringMatching(/\d{4}-\d{2}-\d{2}T/)
      }),
      expect.objectContaining({
        id: "skill:managed:reviewer",
        kind: "skill",
        name: "reviewer (managed)",
        path: join(managedSkillsDir, "reviewer", "SKILL.md"),
        updatedAt: expect.stringMatching(/\d{4}-\d{2}-\d{2}T/)
      }),
      expect.objectContaining({
        id: "skill:workspace:alpha",
        kind: "skill",
        name: "alpha (workspace)",
        path: join(workspaceSkillsDir, "alpha", "SKILL.md"),
        updatedAt: expect.stringMatching(/\d{4}-\d{2}-\d{2}T/)
      }),
      expect.objectContaining({
        id: "skill:workspace:planner",
        kind: "skill",
        name: "planner (workspace)",
        path: join(workspaceSkillsDir, "planner", "SKILL.md"),
        updatedAt: expect.stringMatching(/\d{4}-\d{2}-\d{2}T/)
      })
    ]);
  });

  it("includes ready bundled skills as read-only entries alongside managed and workspace skills", async () => {
    const bundledSkillsDir = join(rootDir, "openclaw-install", "skills");
    await mkdir(join(bundledSkillsDir, "healthcheck"), { recursive: true });
    await writeFile(
      join(bundledSkillsDir, "healthcheck", "SKILL.md"),
      "# Healthcheck"
    );
    await mkdir(join(managedSkillsDir, "reviewer"), { recursive: true });
    await writeFile(join(managedSkillsDir, "reviewer", "SKILL.md"), "# Reviewer");

    const provider = createLocalFilesystemProvider(rootDir, {
      bundledSkillCatalog: {
        async listReadySkills() {
          return [
            {
              name: "healthcheck",
              path: join(bundledSkillsDir, "healthcheck", "SKILL.md")
            }
          ];
        }
      }
    });

    await expect(provider.listDocuments()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "skill:bundled:healthcheck",
          name: "healthcheck",
          source: "bundled",
          editable: false,
          path: join(bundledSkillsDir, "healthcheck", "SKILL.md")
        }),
        expect.objectContaining({
          id: "skill:managed:reviewer",
          source: "managed",
          editable: true
        }),
        expect.objectContaining({
          id: "skill:workspace:planner",
          source: "workspace",
          editable: true
        })
      ])
    );

    await expect(
      provider.readDocument("skill:bundled:healthcheck")
    ).resolves.toEqual(
      expect.objectContaining({
        id: "skill:bundled:healthcheck",
        source: "bundled",
        editable: false,
        content: "# Healthcheck"
      })
    );

    await expect(
      provider.writeDocument("skill:bundled:healthcheck", "# Updated")
    ).rejects.toThrow(/read-only/i);
  });

  it("skips invalid skill directories without dropping valid skills", async () => {
    await mkdir(join(workspaceSkillsDir, "bad name"), { recursive: true });
    await writeFile(join(workspaceSkillsDir, "bad name", "SKILL.md"), "# Invalid");

    const provider = createLocalFilesystemProvider(rootDir);
    const result = await provider.listDocuments();

    expect(result.map((document) => document.id)).toContain("skill:workspace:planner");
    expect(result.map((document) => document.id)).not.toContain("skill:bad name");
  });

  it("rejects non-allowlisted document ids at the provider boundary", async () => {
    const provider = createLocalFilesystemProvider(rootDir);

    await expect(provider.readDocument("unknown-id")).rejects.toThrow(/not allowlisted/i);
  });

  it("treats missing skills directory as empty but surfaces unexpected listing failures", async () => {
    const withoutSkillsRoot = await mkdtemp(join(tmpdir(), "gate-dashboard-no-skills-"));
    await mkdir(join(withoutSkillsRoot, ".openclaw", "workspace"), { recursive: true });
    await writeFile(join(withoutSkillsRoot, ".openclaw", "workspace", "AGENTS.md"), "# Agents");

    await expect(createLocalFilesystemProvider(withoutSkillsRoot).listDocuments()).resolves.toEqual([
      expect.objectContaining({
        id: "agents-md",
        kind: "file",
        path: join(withoutSkillsRoot, ".openclaw", "workspace", "AGENTS.md")
      })
    ]);

    const invalidSkillsRoot = await mkdtemp(join(tmpdir(), "gate-dashboard-invalid-skills-"));
    await mkdir(join(invalidSkillsRoot, ".openclaw", "workspace"), { recursive: true });
    await writeFile(join(invalidSkillsRoot, ".openclaw", "workspace", "AGENTS.md"), "# Agents");
    await writeFile(join(invalidSkillsRoot, ".openclaw", "workspace", "skills"), "not a directory");

    await expect(createLocalFilesystemProvider(invalidSkillsRoot).listDocuments()).rejects.toMatchObject({
      code: "ENOTDIR"
    });
  });
});
