// input: mocked file API responses and simulated editor/list interactions
// output: assertions for the files workspace error handling and save-lock behavior
// pos: integration tests for the files feature wrapper around the shared document workspace
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FilesScreen } from "./FilesScreen";

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

describe("FilesScreen", () => {
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

  it("shows a save error when a file update fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input.toString();

        if (url.endsWith("/api/files") && !init?.method) {
          return Promise.resolve(
            jsonResponse({
              data: [
                {
                  id: "agents-md",
                  name: "AGENTS.md",
                  path: "AGENTS.md",
                  kind: "file"
                }
              ]
            })
          );
        }

        if (url.endsWith("/api/files/agents-md") && !init?.method) {
          return Promise.resolve(
            jsonResponse({
              data: {
                id: "agents-md",
                name: "AGENTS.md",
                path: "AGENTS.md",
                kind: "file",
                content: "# Agents"
              }
            })
          );
        }

        if (url.endsWith("/api/files/agents-md") && init?.method === "PUT") {
          return Promise.resolve(
            jsonResponse(
              {
                error: {
                  code: "write_failed",
                  message: "Write failed"
                }
              },
              500
            )
          );
        }

        return Promise.reject(new Error(`Unhandled request: ${url}`));
      })
    );

    await act(async () => {
      root.render(<FilesScreen />);
    });

    await vi.waitFor(() => {
      expect(container.textContent).toContain("AGENTS.md");
      expect((container.querySelector("textarea") as HTMLTextAreaElement)?.value).toBe(
        "# Agents"
      );
    });

    const textarea = container.querySelector("textarea");
    const saveButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.match(/save/i)
    );

    await act(async () => {
      changeTextareaValue(textarea as HTMLTextAreaElement, "# Broken");
      saveButton?.click();
    });

    await vi.waitFor(() => {
      expect(container.textContent).toContain("Unable to save file: Write failed");
    });
  });

  it("disables file switching while a save is in flight", async () => {
    const saveRequest = createDeferredResponse();

    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input.toString();

        if (url.endsWith("/api/files") && !init?.method) {
          return Promise.resolve(
            jsonResponse({
              data: [
                {
                  id: "agents-md",
                  name: "AGENTS.md",
                  path: "AGENTS.md",
                  kind: "file"
                },
                {
                  id: "user-md",
                  name: "USER.md",
                  path: "USER.md",
                  kind: "file"
                }
              ]
            })
          );
        }

        if (url.endsWith("/api/files/agents-md") && !init?.method) {
          return Promise.resolve(
            jsonResponse({
              data: {
                id: "agents-md",
                name: "AGENTS.md",
                path: "AGENTS.md",
                kind: "file",
                content: "# Agents"
              }
            })
          );
        }

        if (url.endsWith("/api/files/agents-md") && init?.method === "PUT") {
          return saveRequest.promise;
        }

        if (url.endsWith("/api/files/user-md") && !init?.method) {
          return Promise.resolve(
            jsonResponse({
              data: {
                id: "user-md",
                name: "USER.md",
                path: "USER.md",
                kind: "file",
                content: "# User"
              }
            })
          );
        }

        return Promise.reject(new Error(`Unhandled request: ${url}`));
      })
    );

    await act(async () => {
      root.render(<FilesScreen />);
    });

    await vi.waitFor(() => {
      expect((container.querySelector("textarea") as HTMLTextAreaElement)?.value).toBe(
        "# Agents"
      );
    });

    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    const saveButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.match(/save/i)
    );

    await act(async () => {
      changeTextareaValue(textarea, "# Updated Agents");
      saveButton?.click();
    });

    const userButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("USER.md")
    );

    expect(userButton).toBeDefined();
    expect((userButton as HTMLButtonElement).disabled).toBe(true);

    await act(async () => {
      saveRequest.resolve(
        jsonResponse({
          data: {
            id: "agents-md",
            name: "AGENTS.md",
            path: "AGENTS.md",
            kind: "file",
            content: "# Updated Agents"
          }
        })
      );
      await Promise.resolve();
    });

    await vi.waitFor(() => {
      expect((userButton as HTMLButtonElement).disabled).toBe(false);
      expect(container.textContent).toContain("Changes saved.");
    });
  });
});
