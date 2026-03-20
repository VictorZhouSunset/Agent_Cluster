// input: current markdown content plus save/error state from a parent document workspace
// output: rendered markdown preview with edit, cancel, and save controls contained within the editor card
// pos: reusable dashboard document editor shared by files and skills screens
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

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
  const [isEditing, setIsEditing] = useState(isSaving);
  const visibleStatusMessage =
    // Hide the old success state as soon as the local draft diverges again.
    draftContent === content ? statusMessage : undefined;

  useEffect(() => {
    setDraftContent(content);
    setIsEditing(false);
  }, [content]);

  useEffect(() => {
    if (isSaving) {
      setIsEditing(true);
    }
  }, [isSaving]);

  return (
    <article
      style={{
        border: "1px solid #cbd5e1",
        borderRadius: "0.75rem",
        padding: "1rem",
        backgroundColor: "#ffffff",
        display: "grid",
        gap: "0.75rem",
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        boxSizing: "border-box"
      }}
    >
      <div>
        <h4 style={{ marginTop: 0, marginBottom: "0.35rem" }}>{title}</h4>
        <p style={{ margin: 0, color: "#475569" }}>
          Preview the rendered markdown, then switch into edit mode when you need to update it.
        </p>
      </div>

      {isEditing ? (
        <textarea
          value={draftContent}
          disabled={isSaving}
          onChange={(event) => setDraftContent(event.target.value)}
          rows={18}
          style={{
            display: "block",
            width: "100%",
            maxWidth: "100%",
            minWidth: 0,
            minHeight: "20rem",
            padding: "0.9rem",
            borderRadius: "0.75rem",
            border: "1px solid #cbd5e1",
            fontFamily: "monospace",
            fontSize: "0.95rem",
            resize: "vertical",
            boxSizing: "border-box"
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            maxWidth: "100%",
            minWidth: 0,
            minHeight: "20rem",
            padding: "0.9rem",
            borderRadius: "0.75rem",
            border: "1px solid #cbd5e1",
            backgroundColor: "#f8fafc",
            boxSizing: "border-box",
            overflowX: "auto"
          }}
        >
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        {isEditing ? (
          <>
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
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => {
                setDraftContent(content);
                setIsEditing(false);
              }}
              style={{
                border: "1px solid #cbd5e1",
                borderRadius: "0.75rem",
                padding: "0.75rem 1rem",
                backgroundColor: "#ffffff",
                color: "#0f172a",
                cursor: isSaving ? "wait" : "pointer"
              }}
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={isSaving}
            onClick={() => setIsEditing(true)}
            style={{
              border: "1px solid #0f172a",
              borderRadius: "0.75rem",
              padding: "0.75rem 1rem",
              backgroundColor: "#0f172a",
              color: "#ffffff",
              cursor: isSaving ? "wait" : "pointer"
            }}
          >
            Edit
          </button>
        )}
        {visibleStatusMessage ? (
          <p style={{ margin: 0, color: "#166534" }}>{visibleStatusMessage}</p>
        ) : null}
      </div>

      {errorMessage ? <p role="alert" style={{ margin: 0 }}>{errorMessage}</p> : null}
    </article>
  );
}
