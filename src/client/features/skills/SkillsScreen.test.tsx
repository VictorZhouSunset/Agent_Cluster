// input: mocked skill API responses and simulated editor/list interactions
// output: assertions for the skills workspace list, editor, and save-lock behavior
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

  it("loads a skill, renders its content, and saves edits", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url.endsWith("/api/skills") && !init?.method) {
        return Promise.resolve(
          jsonResponse({
            data: [
              {
                id: "skill:planner",
                name: "Planner",
                path: "skills/planner/SKILL.md",
                kind: "skill"
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
      expect(container.textContent).toContain("Skills");
      expect(container.textContent).toContain("Planner");
      expect((container.querySelector("textarea") as HTMLTextAreaElement)?.value).toBe(
        "# Planner"
      );
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

      if (url.endsWith("/api/skills") && !init?.method) {
        return Promise.resolve(
          jsonResponse({
            data: [
              {
                id: "skill:planner",
                name: "Planner",
                path: "skills/planner/SKILL.md",
                kind: "skill"
              },
              {
                id: "skill:reviewer",
                name: "Reviewer",
                path: "skills/reviewer/SKILL.md",
                kind: "skill"
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
      expect((container.querySelector("textarea") as HTMLTextAreaElement)?.value).toBe(
        "# Planner"
      );
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
});
