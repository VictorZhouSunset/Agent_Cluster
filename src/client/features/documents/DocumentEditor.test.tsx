// input: document editor props and simulated user edits during editor-only tests
// output: assertions for editor save, save-state locking, and status-message behavior
// pos: focused unit tests for the reusable markdown editor component
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DocumentEditor } from "./DocumentEditor";

function changeTextareaValue(textarea: HTMLTextAreaElement, value: string) {
  const setValue = Object.getOwnPropertyDescriptor(
    HTMLTextAreaElement.prototype,
    "value"
  )?.set;

  setValue?.call(textarea, value);
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("DocumentEditor", () => {
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

  it("loads content into the editor and saves edits", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    await act(async () => {
      root.render(
        <DocumentEditor
          title="AGENTS.md"
          content="# Agents"
          onSave={onSave}
        />
      );
    });

    const textarea = container.querySelector("textarea");
    const saveButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.match(/save/i)
    );

    expect(textarea).toBeInstanceOf(HTMLTextAreaElement);
    expect(textarea?.value).toBe("# Agents");
    expect(saveButton).toBeDefined();

    await act(async () => {
      changeTextareaValue(textarea as HTMLTextAreaElement, "# Updated");
      saveButton?.click();
    });

    expect(onSave).toHaveBeenCalledWith("# Updated");
  });

  it("hides the saved status message once the draft changes again", async () => {
    await act(async () => {
      root.render(
        <DocumentEditor
          title="AGENTS.md"
          content="# Agents"
          onSave={vi.fn().mockResolvedValue(undefined)}
          statusMessage="Changes saved."
        />
      );
    });

    expect(container.textContent).toContain("Changes saved.");

    const textarea = container.querySelector("textarea");

    await act(async () => {
      changeTextareaValue(textarea as HTMLTextAreaElement, "# Unsaved changes");
    });

    expect(container.textContent).not.toContain("Changes saved.");
  });

  it("disables the editor input while a save is in flight", async () => {
    await act(async () => {
      root.render(
        <DocumentEditor
          title="AGENTS.md"
          content="# Agents"
          onSave={vi.fn().mockResolvedValue(undefined)}
          isSaving
        />
      );
    });

    const textarea = container.querySelector("textarea");
    const saveButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.match(/saving/i)
    );

    expect(textarea).toBeInstanceOf(HTMLTextAreaElement);
    expect((textarea as HTMLTextAreaElement).disabled).toBe(true);
    expect(saveButton).toBeDefined();
    expect((saveButton as HTMLButtonElement).disabled).toBe(true);
  });
});
