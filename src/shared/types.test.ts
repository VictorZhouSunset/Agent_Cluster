// input: shared dashboard DTO exports and provider interface types
// output: type-level and runtime assertions that guard the public contract surface
// pos: contract tests for the shared dashboard data model
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import { describe, expect, expectTypeOf, it } from "vitest";
import {
  dashboardSections,
  type AgentStatus,
  type ClusterNode,
  type DashboardHealth,
  type DashboardSection,
  type EditableDocument,
  type EditableDocumentContent,
  type EditableDocumentId,
  type SessionSummary,
} from "./types";
import type { FilesystemProvider, UpdateEditableDocumentInput } from "../server/providers/filesystem/types.js";
import type { OpenClawProvider } from "../server/providers/openclaw/types.js";

describe("dashboard DTO contracts", () => {
  it("supports known dashboard sections", () => {
    const section: DashboardSection = "overview";

    expect(section).toBe("overview");
    expect(dashboardSections).toEqual(["overview", "sessions", "skills", "files"]);
  });

  it("supports a session summary with optional node metadata", () => {
    const session: SessionSummary = {
      id: "s-1",
      title: "Example",
      updatedAt: "2026-03-13T12:00:00.000Z",
      nodeId: "local",
      nodeName: "Gate",
    };

    expect(session.nodeId).toBe("local");
  });

  it("supports editable document metadata", () => {
    const doc: EditableDocument = {
      id: "agents-md",
      name: "AGENTS.md",
      path: "AGENTS.md",
      kind: "file",
    };

    expect(doc.kind).toBe("file");
  });

  it("supports agent health cards", () => {
    const agent: AgentStatus = {
      id: "a-1",
      name: "Planner",
      status: "idle",
      nodeId: "agent-1",
      nodeName: "Gate Node"
    };

    expect(agent.status).toBe("idle");
    expect(agent.nodeId).toBe("agent-1");
  });

  it("supports cluster node summaries for overview and document scoping", () => {
    const node: ClusterNode = {
      id: "agent-2",
      name: "OpenMoose02_MD",
      kind: "md",
      origin: "remote",
      status: "healthy",
      checkedAt: "2026-03-16T00:00:00.000Z",
      supportsSessions: false,
      supportsSkills: true,
      supportsFiles: true,
      supportsWrites: true
    };

    expect(node.kind).toBe("md");
    expect(node.origin).toBe("remote");
  });

  it("keeps shared DTOs and provider signatures aligned at the type level", () => {
    expectTypeOf<DashboardSection>().toEqualTypeOf<"overview" | "sessions" | "skills" | "files">();
    expectTypeOf<EditableDocumentId>().toEqualTypeOf<string>();
    expectTypeOf<EditableDocument["id"]>().toEqualTypeOf<EditableDocumentId>();
    expectTypeOf<EditableDocumentContent["id"]>().toEqualTypeOf<EditableDocumentId>();
    expectTypeOf<SessionSummary["nodeId"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<DashboardHealth["status"]>().toEqualTypeOf<"healthy" | "degraded" | "offline">();
    expectTypeOf<ClusterNode["kind"]>().toEqualTypeOf<"gate" | "md" | "other">();
    expectTypeOf<ClusterNode["origin"]>().toEqualTypeOf<"local" | "remote">();
    expectTypeOf<AgentStatus["nodeId"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<UpdateEditableDocumentInput["id"]>().toEqualTypeOf<EditableDocumentId>();

    expectTypeOf<OpenClawProvider["getHealth"]>().returns.toEqualTypeOf<Promise<DashboardHealth>>();
    expectTypeOf<OpenClawProvider["listNodes"]>().returns.toEqualTypeOf<Promise<ClusterNode[]>>();
    expectTypeOf<FilesystemProvider["readEditableDocument"]>().parameters.toEqualTypeOf<
      [documentId: EditableDocumentId, options?: { kind?: "file" | "skill"; nodeId?: string } | undefined]
    >();
    expectTypeOf<FilesystemProvider["writeEditableDocument"]>().parameters.toEqualTypeOf<
      [input: UpdateEditableDocumentInput]
    >();
  });
});
