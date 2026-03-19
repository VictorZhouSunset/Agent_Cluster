import { describe, expect, it } from "vitest";
import { resolveEditableTarget } from "./allowlist";

describe("resolveEditableTarget", () => {
  it("allows AGENTS.md", () => {
    expect(resolveEditableTarget("agents-md").relativePath).toBe(".openclaw/workspace/AGENTS.md");
  });

  it("allows SOUL.md", () => {
    expect(resolveEditableTarget("soul-md").relativePath).toBe(".openclaw/workspace/SOUL.md");
  });

  it("allows USER.md", () => {
    expect(resolveEditableTarget("user-md").relativePath).toBe(".openclaw/workspace/USER.md");
  });

  it("allows TOOLS.md", () => {
    expect(resolveEditableTarget("tools-md").relativePath).toBe(".openclaw/workspace/TOOLS.md");
  });

  it("allows the additional OpenClaw workspace markdown files", () => {
    expect(resolveEditableTarget("bootstrap-md").relativePath).toBe(".openclaw/workspace/BOOTSTRAP.md");
    expect(resolveEditableTarget("heartbeat-md").relativePath).toBe(".openclaw/workspace/HEARTBEAT.md");
    expect(resolveEditableTarget("identity-md").relativePath).toBe(".openclaw/workspace/IDENTITY.md");
  });

  it("allows workspace and managed skill markdown files", () => {
    expect(resolveEditableTarget("skill:planner").relativePath).toBe(".openclaw/workspace/skills/planner/SKILL.md");
    expect(resolveEditableTarget("skill:managed:planner").relativePath).toBe(".openclaw/skills/planner/SKILL.md");
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
