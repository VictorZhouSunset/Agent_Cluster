// input: mocked skill API responses and simulated preview, edit, and save interactions
// output: assertions for the skills workspace list, rendered preview mode, save-lock behavior, and node-scoped selection
// pos: integration tests for the skills feature wrapper around the shared document workspace
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SkillsScreen } from "./SkillsScreen";

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function createDeferredResponse() {
  let resolveResponse: (response: Response) => void;
  let rejectResponse: (error: Error) => void;

  const promise = new Promise<Response>((resolve, reject) => {
    resolveResponse = resolve;
    rejectResponse = reject;
  });

  return {
    promise,
    resolve(response: Response) {
      resolveResponse(response);
    },
    reject(error: Error) {
      rejectResponse(error);
    }
  };
}

function changeTextareaValue(textarea: HTMLTextAreaElement, value: string) {
  const setValue = Object.getOwnPropertyDescriptor(
    HTMLTextAreaElement.prototype,
    "value"
  )?.set;

  setValue?.call(textarea, value);
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("SkillsScreen", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean })
      .IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.restoreAllMocks();
  });

  it("groups bundled, managed, and workspace skills while keeping bundled skills read-only", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input.toString();

        if (url.endsWith("/api/nodes")) {
          return Promise.resolve(
            jsonResponse({
              data: [
                {
                  id: "openmoose03-cio",
                  name: "OpenMoose03_CIO",
                  kind: "gate",
                  origin: "local",
                  status: "healthy",
                  checkedAt: "2026-03-16T00:00:00.000Z",
                  supportsSessions: true,
                  supportsSkills: true,
                  supportsFiles: true,
                  supportsWrites: true
                }
              ]
            })
          );
        }

        if (url.endsWith("/api/skills") && !init?.method) {
          return Promise.resolve(
            jsonResponse({
              data: [
                {
                  id: "skill:bundled:healthcheck",
                  name: "healthcheck",
                  path: "/opt/openclaw/skills/healthcheck/SKILL.md",
                  kind: "skill",
                  source: "bundled",
                  editable: false
                },
                {
                  id: "skill:managed:reviewer",
                  name: "reviewer",
                  path: "/home/ec2-user/.openclaw/skills/reviewer/SKILL.md",
                  kind: "skill",
                  source: "managed",
                  editable: true
                },
                {
                  id: "skill:workspace:planner",
                  name: "planner",
                  path: "/home/ec2-user/.openclaw/workspace/skills/planner/SKILL.md",
                  kind: "skill",
                  source: "workspace",
                  editable: true
                }
              ]
            })
          );
        }

        if (url.endsWith("/api/skills/bundled%3Ahealthcheck") && !init?.method) {
          return Promise.resolve(
            jsonResponse({
              data: {
                id: "skill:bundled:healthcheck",
                name: "healthcheck",
                path: "/opt/openclaw/skills/healthcheck/SKILL.md",
                kind: "skill",
                source: "bundled",
                editable: false,
                content: "# Healthcheck"
              }
            })
          );
        }

        if (url.endsWith("/api/skills/managed%3Areviewer") && !init?.method) {
          return Promise.resolve(
            jsonResponse({
              data: {
                id: "skill:managed:reviewer",
                name: "reviewer",
                path: "/home/ec2-user/.openclaw/skills/reviewer/SKILL.md",
                kind: "skill",
                source: "managed",
                editable: true,
                content: "# Reviewer"
              }
            })
          );
        }

        if (url.endsWith("/api/skills/workspace%3Aplanner") && !init?.method) {
          return Promise.resolve(
            jsonResponse({
              data: {
                id: "skill:workspace:planner",
                name: "planner",
                path: "/home/ec2-user/.openclaw/workspace/skills/planner/SKILL.md",
                kind: "skill",
                source: "workspace",
                editable: true,
                content: "# Planner"
              }
            })
          );
        }

        return Promise.reject(new Error(`Unhandled request: ${url}`));
      })
    );

    await act(async () => {
      root.render(<SkillsScreen />);
    });

    await vi.waitFor(() => {
      expect(container.querySelector('[data-ui="documents-workbench"]')).toBeTruthy();
      expect(container.textContent).toContain("Bundled");
      expect(container.textContent).toContain("Managed");
      expect(container.textContent).toContain("Workspace");
      expect(container.textContent).toContain("healthcheck");
      expect(container.textContent).toContain("reviewer");
      expect(container.textContent).toContain("planner");
      expect(container.querySelector("h1")?.textContent).toBe("Healthcheck");
      expect(
        Array.from(container.querySelectorAll("button")).find(
          (button) => button.textContent === "Edit"
        )
      ).toBeUndefined();
    });

    const reviewerButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("reviewer")
    );

    await act(async () => {
      reviewerButton?.click();
    });

    await vi.waitFor(() => {
      expect(container.querySelector("h1")?.textContent).toBe("Reviewer");
      expect(
        Array.from(container.querySelectorAll("button")).find(
          (button) => button.textContent === "Edit"
        )
      ).toBeDefined();
    });
  });

  it("loads a skill, renders its content, and saves edits", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url.endsWith("/api/nodes")) {
        return Promise.resolve(
          jsonResponse({
            data: [
              {
                id: "openmoose03-cio",
                name: "OpenMoose03_CIO",
                kind: "gate",
                origin: "local",
                status: "healthy",
                checkedAt: "2026-03-16T00:00:00.000Z",
                supportsSessions: true,
                supportsSkills: true,
                supportsFiles: true,
                supportsWrites: true
              },
              {
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
              }
            ]
          })
        );
      }

      if (url.endsWith("/api/skills") && !init?.method) {
        return Promise.resolve(
          jsonResponse({
            data: [
              {
                id: "skill:planner",
                name: "Planner",
                path: "skills/planner/SKILL.md",
                kind: "skill",
                source: "workspace",
                editable: true
              }
            ]
          })
        );
      }

      if (url.endsWith("/api/skills/planner") && !init?.method) {
        return Promise.resolve(
          jsonResponse({
            data: {
              id: "skill:planner",
              name: "Planner",
              path: "skills/planner/SKILL.md",
              kind: "skill",
              source: "workspace",
              editable: true,
              content: "# Planner"
            }
          })
        );
      }

      if (url.endsWith("/api/skills/planner") && init?.method === "PUT") {
        return Promise.resolve(
          jsonResponse({
            data: {
              id: "skill:planner",
              name: "Planner",
              path: "skills/planner/SKILL.md",
              kind: "skill",
              source: "workspace",
              editable: true,
              content: "# Updated Planner"
            }
          })
        );
      }

      return Promise.reject(new Error(`Unhandled request: ${url}`));
    });

    vi.stubGlobal("fetch", fetchMock);

    await act(async () => {
      root.render(<SkillsScreen />);
    });

    await vi.waitFor(() => {
      expect(container.querySelector('[data-ui="documents-toolbar"]')).toBeTruthy();
      expect(container.querySelector('[data-ui="documents-list"]')).toBeTruthy();
      expect(container.querySelector('[data-ui="documents-detail"]')).toBeTruthy();
      expect(container.textContent).toContain("Skills");
      expect(container.textContent).toContain("Node");
      expect(container.textContent).toContain("OpenMoose03_CIO");
      expect(container.textContent).toContain("Planner");
      expect(container.querySelector("h1")?.textContent).toBe("Planner");
      expect(container.querySelector("textarea")).toBeNull();
    });

    const editButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Edit"
    );

    await act(async () => {
      editButton?.click();
    });

    const textarea = container.querySelector("textarea");
    const saveButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.match(/save/i)
    );

    await act(async () => {
      changeTextareaValue(textarea as HTMLTextAreaElement, "# Updated Planner");
      saveButton?.click();
    });

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/skills/planner", {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ content: "# Updated Planner" })
      });
      expect(container.textContent).toContain("Changes saved.");
    });
  });

  it("disables skill switching while a save is in flight", async () => {
    const saveRequest = createDeferredResponse();
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url.endsWith("/api/nodes")) {
        return Promise.resolve(
          jsonResponse({
            data: [
              {
                id: "openmoose03-cio",
                name: "OpenMoose03_CIO",
                kind: "gate",
                origin: "local",
                status: "healthy",
                checkedAt: "2026-03-16T00:00:00.000Z",
                supportsSessions: true,
                supportsSkills: true,
                supportsFiles: true,
                supportsWrites: true
              }
            ]
          })
        );
      }

      if (url.endsWith("/api/skills") && !init?.method) {
        return Promise.resolve(
          jsonResponse({
            data: [
              {
                id: "skill:planner",
                name: "Planner",
                path: "skills/planner/SKILL.md",
                kind: "skill",
                source: "workspace",
                editable: true
              },
              {
                id: "skill:reviewer",
                name: "Reviewer",
                path: "skills/reviewer/SKILL.md",
                kind: "skill",
                source: "managed",
                editable: true
              }
            ]
          })
        );
      }

      if (url.endsWith("/api/skills/planner") && !init?.method) {
        return Promise.resolve(
          jsonResponse({
            data: {
              id: "skill:planner",
              name: "Planner",
              path: "skills/planner/SKILL.md",
              kind: "skill",
              source: "workspace",
              editable: true,
              content: "# Planner"
            }
          })
        );
      }

      if (url.endsWith("/api/skills/planner") && init?.method === "PUT") {
        return saveRequest.promise;
      }

      if (url.endsWith("/api/skills/reviewer") && !init?.method) {
        return Promise.resolve(
          jsonResponse({
            data: {
              id: "skill:reviewer",
              name: "Reviewer",
              path: "skills/reviewer/SKILL.md",
              kind: "skill",
              source: "managed",
              editable: true,
              content: "# Reviewer"
            }
          })
        );
      }

      return Promise.reject(new Error(`Unhandled request: ${url}`));
    });

    vi.stubGlobal("fetch", fetchMock);

    await act(async () => {
      root.render(<SkillsScreen />);
    });

    await vi.waitFor(() => {
      expect(container.querySelector('[data-ui="documents-workbench"]')).toBeTruthy();
      expect(container.querySelector('[data-ui="document-header"]')).toBeTruthy();
      expect(container.querySelector("h1")?.textContent).toBe("Planner");
    });

    const editButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Edit"
    );

    await act(async () => {
      editButton?.click();
    });

    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    const saveButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.match(/save/i)
    );

    await act(async () => {
      changeTextareaValue(textarea, "# Updated Planner");
      saveButton?.click();
    });

    const reviewerButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Reviewer")
    );

    expect(reviewerButton).toBeDefined();
    expect((reviewerButton as HTMLButtonElement).disabled).toBe(true);

    await act(async () => {
      saveRequest.resolve(
        jsonResponse({
          data: {
            id: "skill:planner",
            name: "Planner",
            path: "skills/planner/SKILL.md",
            kind: "skill",
            content: "# Updated Planner"
          }
        })
      );
      await Promise.resolve();
    });

    await vi.waitFor(() => {
      expect((reviewerButton as HTMLButtonElement).disabled).toBe(false);
      expect(container.textContent).toContain("Changes saved.");
    });
  });

  it("switches to a remote node and scopes skill requests to that node", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url.endsWith("/api/nodes")) {
        return Promise.resolve(
          jsonResponse({
            data: [
              {
                id: "openmoose03-cio",
                name: "OpenMoose03_CIO",
                kind: "gate",
                origin: "local",
                status: "healthy",
                checkedAt: "2026-03-16T00:00:00.000Z",
                supportsSessions: true,
                supportsSkills: true,
                supportsFiles: true,
                supportsWrites: true
              },
              {
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
              }
            ]
          })
        );
      }

      if (url.endsWith("/api/skills") && !url.includes("?") && !init?.method) {
        return Promise.resolve(
          jsonResponse({
            data: [
              {
                id: "skill:planner",
                name: "Planner",
                path: "skills/planner/SKILL.md",
                kind: "skill",
                source: "workspace",
                editable: true
              }
            ]
          })
        );
      }

      if (url.includes("/api/skills?node=agent-2") && !init?.method) {
        return Promise.resolve(
          jsonResponse({
            data: [
              {
                id: "skill:software-dev",
                name: "software-dev",
                path: "skills/software-dev/SKILL.md",
                kind: "skill",
                source: "workspace",
                editable: true
              }
            ]
          })
        );
      }

      if (url.endsWith("/api/skills/planner") && !init?.method) {
        return Promise.resolve(
          jsonResponse({
            data: {
              id: "skill:planner",
              name: "Planner",
              path: "skills/planner/SKILL.md",
              kind: "skill",
              source: "workspace",
              editable: true,
              content: "# Planner"
            }
          })
        );
      }

      if (url.includes("/api/skills/software-dev?node=agent-2") && !init?.method) {
        return Promise.resolve(
          jsonResponse({
            data: {
              id: "skill:software-dev",
              name: "software-dev",
              path: "skills/software-dev/SKILL.md",
              kind: "skill",
              source: "workspace",
              editable: true,
              content: "# Remote Skill"
            }
          })
        );
      }

      return Promise.reject(new Error(`Unhandled request: ${url}`));
    });

    vi.stubGlobal("fetch", fetchMock);

    await act(async () => {
      root.render(<SkillsScreen />);
    });

    await vi.waitFor(() => {
      expect(container.querySelector('[data-ui="documents-toolbar"]')).toBeTruthy();
      expect((container.querySelector("select") as HTMLSelectElement)?.value).toBe(
        "openmoose03-cio"
      );
    });

    await act(async () => {
      const select = container.querySelector("select") as HTMLSelectElement;
      const setValue = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set;
      setValue?.call(select, "agent-2");
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });

    await vi.waitFor(() => {
      expect(container.querySelector('[data-ui="document-preview"]')).toBeTruthy();
      expect(container.querySelector("h1")?.textContent).toBe("Remote Skill");
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/skills?node=agent-2", {
      headers: {
        Accept: "application/json"
      }
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/skills/software-dev?node=agent-2", {
      headers: {
        Accept: "application/json"
      }
    });
  });
});
