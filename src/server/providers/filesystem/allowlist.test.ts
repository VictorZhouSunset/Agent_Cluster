import { describe, expect, it } from "vitest";
import { resolveEditableTarget } from "./allowlist";

describe("resolveEditableTarget", () => {
  it("allows AGENTS.md", () => {
    expect(resolveEditableTarget("agents-md").relativePath).toBe("AGENTS.md");
  });

  it("allows SOUL.md", () => {
    expect(resolveEditableTarget("soul-md").relativePath).toBe("SOUL.md");
  });

  it("allows USER.md", () => {
    expect(resolveEditableTarget("user-md").relativePath).toBe("USER.md");
  });

  it("allows TOOLS.md", () => {
    expect(resolveEditableTarget("tools-md").relativePath).toBe("TOOLS.md");
  });

  it("allows skill markdown files only", () => {
    expect(resolveEditableTarget("skill:planner").relativePath).toBe("skills/planner/SKILL.md");
  });

  it("rejects unknown ids", () => {
    expect(() => resolveEditableTarget("unknown-id")).toThrow(/not allowlisted/i);
  });

  it("rejects prototype property ids", () => {
    expect(() => resolveEditableTarget("toString")).toThrow(/not allowlisted/i);
  });

  it("rejects traversal", () => {
    expect(() => resolveEditableTarget("../secret")).toThrow(/not allowlisted/i);
  });

  it("rejects parent-directory skill ids", () => {
    expect(() => resolveEditableTarget("skill:..")).toThrow(/not allowlisted/i);
  });

  it("rejects traversal-style skill names", () => {
    expect(() => resolveEditableTarget("skill:../planner")).toThrow(/not allowlisted/i);
  });

  it("rejects windows-style traversal skill names", () => {
    expect(() => resolveEditableTarget("skill:..\\planner")).toThrow(/not allowlisted/i);
  });
});
