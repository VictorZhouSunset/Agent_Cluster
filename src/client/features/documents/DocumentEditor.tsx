// input: current document content, save callback, and save/error status from a parent screen
// output: editable markdown textarea with save controls and status feedback
// pos: reusable editor widget for all editable dashboard documents
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import { useEffect, useState } from "react";

type DocumentEditorProps = {
  title: string;
  content: string;
  onSave: (content: string) => Promise<void>;
  isSaving?: boolean;
  statusMessage?: string;
  errorMessage?: string;
};

export function DocumentEditor({
  title,
  content,
  onSave,
  isSaving = false,
  statusMessage,
  errorMessage
}: DocumentEditorProps) {
  const [draftContent, setDraftContent] = useState(content);
  const visibleStatusMessage =
    // Hide the old success state as soon as the local draft diverges again.
    draftContent === content ? statusMessage : undefined;

  useEffect(() => {
    setDraftContent(content);
  }, [content]);

  return (
    <article
      style={{
        border: "1px solid #cbd5e1",
        borderRadius: "0.75rem",
        padding: "1rem",
        backgroundColor: "#ffffff",
        display: "grid",
        gap: "0.75rem"
      }}
    >
      <div>
        <h4 style={{ marginTop: 0, marginBottom: "0.35rem" }}>{title}</h4>
        <p style={{ margin: 0, color: "#475569" }}>Edit markdown content carefully.</p>
      </div>

      <textarea
        value={draftContent}
        disabled={isSaving}
        onChange={(event) => setDraftContent(event.target.value)}
        rows={18}
        style={{
          width: "100%",
          minHeight: "20rem",
          padding: "0.9rem",
          borderRadius: "0.75rem",
          border: "1px solid #cbd5e1",
          fontFamily: "monospace",
          fontSize: "0.95rem",
          resize: "vertical"
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <button
          type="button"
          disabled={isSaving}
          onClick={() => void onSave(draftContent)}
          style={{
            border: "1px solid #0f172a",
            borderRadius: "0.75rem",
            padding: "0.75rem 1rem",
            backgroundColor: isSaving ? "#cbd5e1" : "#0f172a",
            color: "#ffffff",
            cursor: isSaving ? "wait" : "pointer"
          }}
        >
          {isSaving ? "Saving..." : "Save changes"}
        </button>
        {visibleStatusMessage ? (
          <p style={{ margin: 0, color: "#166534" }}>{visibleStatusMessage}</p>
        ) : null}
      </div>

      {errorMessage ? <p role="alert" style={{ margin: 0 }}>{errorMessage}</p> : null}
    </article>
  );
}
