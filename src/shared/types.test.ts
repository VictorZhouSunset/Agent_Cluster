import { describe, expect, expectTypeOf, it } from "vitest";
import {
  dashboardSections,
  type AgentStatus,
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
    };

    expect(agent.status).toBe("idle");
  });

  it("keeps shared DTOs and provider signatures aligned at the type level", () => {
    expectTypeOf<DashboardSection>().toEqualTypeOf<"overview" | "sessions" | "skills" | "files">();
    expectTypeOf<EditableDocumentId>().toEqualTypeOf<string>();
    expectTypeOf<EditableDocument["id"]>().toEqualTypeOf<EditableDocumentId>();
    expectTypeOf<EditableDocumentContent["id"]>().toEqualTypeOf<EditableDocumentId>();
    expectTypeOf<SessionSummary["nodeId"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<DashboardHealth["status"]>().toEqualTypeOf<"healthy" | "degraded" | "offline">();
    expectTypeOf<UpdateEditableDocumentInput["id"]>().toEqualTypeOf<EditableDocumentId>();

    expectTypeOf<OpenClawProvider["getHealth"]>().returns.toEqualTypeOf<Promise<DashboardHealth>>();
    expectTypeOf<FilesystemProvider["readEditableDocument"]>().parameters.toEqualTypeOf<
      [documentId: EditableDocumentId]
    >();
    expectTypeOf<FilesystemProvider["writeEditableDocument"]>().parameters.toEqualTypeOf<
      [input: UpdateEditableDocumentInput]
    >();
  });
});
