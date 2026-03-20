// input: current markdown content plus save/error state from a parent document workspace
// output: Gemini-inspired preview-first Markdown editor with optional read-only mode and contained controls for files and skills
// pos: reusable dashboard document editor shared by files and skills screens
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

type DocumentEditorProps = {
  title: string;
  content: string;
  onSave: (content: string) => Promise<void>;
  canEdit?: boolean;
  isSaving?: boolean;
  statusMessage?: string;
  errorMessage?: string;
};

export function DocumentEditor({
  title,
  content,
  onSave,
  canEdit = true,
  isSaving = false,
  statusMessage,
  errorMessage
}: DocumentEditorProps) {
  const [draftContent, setDraftContent] = useState(content);
  const [isEditing, setIsEditing] = useState(isSaving);
  const visibleStatusMessage =
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
    <article className="panel detail-shell">
      <div className="detail-header" data-ui="document-header">
        <div className="detail-header__copy">
          <h2 className="detail-title">{title.replace(/\.md$/i, "")}</h2>
          <p className="panel__subtitle">{title}</p>
          <p className="panel__subtitle">
            Preview the rendered markdown, then switch into edit mode when you need to update it.
          </p>
        </div>
        <div className="detail-header__actions">
          {canEdit ? (
            isEditing ? (
            <>
              <button
                className="button-primary"
                type="button"
                disabled={isSaving}
                onClick={() => void onSave(draftContent)}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button
                className="button-secondary"
                type="button"
                disabled={isSaving}
                onClick={() => {
                  setDraftContent(content);
                  setIsEditing(false);
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              className="button-secondary"
              type="button"
              disabled={isSaving}
              onClick={() => setIsEditing(true)}
            >
              Edit
            </button>
            )
          ) : (
            <span className="status-badge status-badge--neutral">Read-only</span>
          )}
        </div>
      </div>

      <div className="detail-body" style={{ display: "grid", gap: "16px" }}>
        {isEditing && canEdit ? (
          <textarea
            className="document-editor-textarea"
            data-ui="document-editor"
            value={draftContent}
            disabled={isSaving}
            onChange={(event) => setDraftContent(event.target.value)}
            rows={18}
            style={{
              display: "block",
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
              boxSizing: "border-box"
            }}
          />
        ) : (
          <div className="document-preview markdown-surface" data-ui="document-preview">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}

        <div className="toolbar-row">
          {visibleStatusMessage ? (
            <p className="success-copy">{visibleStatusMessage}</p>
          ) : null}
        </div>

        {errorMessage ? <p className="error-copy" role="alert">{errorMessage}</p> : null}
      </div>
    </article>
  );
}
