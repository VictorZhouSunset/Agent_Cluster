// input: editable document API functions plus screen copy for one document category
// output: shared Gemini-inspired list/detail workflow for files and skills backed by the current API
// pos: reusable document workspace orchestrator inside the client documents feature
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import { useEffect, useState } from "react";
import type {
  EditableDocument,
  EditableDocumentContent
} from "../../../shared/types";
import { formatShortDateTime } from "../../lib/formatters";
import { DocumentEditor } from "./DocumentEditor";

type DocumentsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; documents: EditableDocument[] };

type DocumentDetailState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; document: EditableDocumentContent };

type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

type EditableDocumentsScreenProps = {
  collectionTitle: string;
  editorTitle: string;
  emptyMessage: string;
  loadingCollectionMessage: string;
  loadingDetailMessage: string;
  idleDetailMessage: string;
  loadCollectionErrorPrefix: string;
  loadDetailErrorPrefix: string;
  saveErrorPrefix: string;
  listDocuments: () => Promise<EditableDocument[]>;
  readDocument: (documentId: string) => Promise<EditableDocumentContent>;
  saveDocument: (
    documentId: string,
    content: string
  ) => Promise<EditableDocumentContent>;
};

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage;
}

export function EditableDocumentsScreen({
  collectionTitle,
  editorTitle,
  emptyMessage,
  loadingCollectionMessage,
  loadingDetailMessage,
  idleDetailMessage,
  loadCollectionErrorPrefix,
  loadDetailErrorPrefix,
  saveErrorPrefix,
  listDocuments,
  readDocument,
  saveDocument
}: EditableDocumentsScreenProps) {
  const [documentsState, setDocumentsState] = useState<DocumentsState>({
    status: "loading"
  });
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [detailState, setDetailState] = useState<DocumentDetailState>({
    status: "idle"
  });
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });

  useEffect(() => {
    let isActive = true;

    async function loadDocuments() {
      try {
        const documents = await listDocuments();

        if (!isActive) {
          return;
        }

        setDocumentsState({
          status: "success",
          documents
        });
        setSelectedDocumentId((currentId) => currentId ?? documents[0]?.id ?? null);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setDocumentsState({
          status: "error",
          message: getErrorMessage(error, `${loadCollectionErrorPrefix}.`)
        });
      }
    }

    void loadDocuments();

    return () => {
      isActive = false;
    };
  }, [listDocuments, loadCollectionErrorPrefix]);

  useEffect(() => {
    if (!selectedDocumentId) {
      setDetailState({ status: "idle" });
      setSaveState({ status: "idle" });
      return;
    }

    const documentId = selectedDocumentId;
    let isActive = true;
    setDetailState({ status: "loading" });
    setSaveState({ status: "idle" });

    async function loadDocument() {
      try {
        const document = await readDocument(documentId);

        if (!isActive) {
          return;
        }

        setDetailState({
          status: "success",
          document
        });
      } catch (error) {
        if (!isActive) {
          return;
        }

        setDetailState({
          status: "error",
          message: getErrorMessage(error, `${loadDetailErrorPrefix}.`)
        });
      }
    }

    void loadDocument();

    return () => {
      isActive = false;
    };
  }, [loadDetailErrorPrefix, readDocument, selectedDocumentId]);

  async function handleSave(content: string) {
    if (detailState.status !== "success") {
      return;
    }

    setSaveState({ status: "saving" });

    try {
      const document = await saveDocument(detailState.document.id, content);

      setDetailState({
        status: "success",
        document
      });
      setSaveState({
        status: "success",
        message: "Changes saved."
      });
    } catch (error) {
      setSaveState({
        status: "error",
        message: `${saveErrorPrefix}: ${getErrorMessage(error, "Save failed.")}`
      });
    }
  }

  const documents =
    documentsState.status === "success" ? documentsState.documents : [];
  const isSaving = saveState.status === "saving";

  return (
    <div className="split-layout">
      <section className="panel split-panel" data-ui="documents-list">
        <div className="panel__header">
          <div>
            <h3 className="panel__title">{collectionTitle}</h3>
            <p className="panel__subtitle">
              Select an allowlisted document to preview or edit.
            </p>
          </div>
        </div>
        <div className="panel__body list-shell">
          {documentsState.status === "loading" ? (
            <p className="loading-copy">{loadingCollectionMessage}</p>
          ) : null}
          {documentsState.status === "error" ? (
            <p className="error-copy" role="alert">
              {loadCollectionErrorPrefix}: {documentsState.message}
            </p>
          ) : null}
          {documentsState.status === "success" ? (
            documents.length > 0 ? (
              <div className="list-scroll">
                {documents.map((document) => {
                  const isSelected = document.id === selectedDocumentId;

                  return (
                    <button
                      key={document.id}
                      className="list-button"
                      type="button"
                      disabled={isSaving}
                      onClick={() => setSelectedDocumentId(document.id)}
                      aria-pressed={isSelected}
                    >
                      <span className="list-button__title">{document.name}</span>
                      <div className="list-button__meta">
                        <span className="list-button__path" data-ui="document-path">
                          {document.path}
                        </span>
                        {document.updatedAt ? (
                          <span className="list-button__timestamp">
                            {formatShortDateTime(document.updatedAt)}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="empty-copy">{emptyMessage}</p>
            )
          ) : null}
        </div>
      </section>

      <section className="split-panel" data-ui="documents-detail">
        {detailState.status === "idle" ? (
          <p className="empty-copy">{idleDetailMessage}</p>
        ) : null}
        {detailState.status === "loading" ? (
          <p className="loading-copy">{loadingDetailMessage}</p>
        ) : null}
        {detailState.status === "error" ? (
          <p className="error-copy" role="alert">
            {loadDetailErrorPrefix}: {detailState.message}
          </p>
        ) : null}
        {detailState.status === "success" ? (
          <DocumentEditor
            title={detailState.document.name}
            content={detailState.document.content}
            onSave={handleSave}
            isSaving={isSaving}
            statusMessage={
              saveState.status === "success" ? saveState.message : undefined
            }
            errorMessage={
              saveState.status === "error" ? saveState.message : undefined
            }
          />
        ) : null}
      </section>
    </div>
  );
}
