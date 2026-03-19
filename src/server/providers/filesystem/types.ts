// input: editable document ids, node scoping, and content updates issued by route handlers
// output: provider contracts for listing, reading, and writing allowlisted documents
// pos: filesystem provider interface shared across server layers
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import type { EditableDocumentKind } from "../../../shared/types.js";
import type {
  EditableDocument,
  EditableDocumentContent,
  EditableDocumentId
} from "../../../shared/types.js";

export interface EditableDocumentQuery {
  kind?: EditableDocumentKind;
  nodeId?: string;
}

export interface ReadEditableDocumentOptions extends EditableDocumentQuery {}

export interface UpdateEditableDocumentInput {
  id: EditableDocumentId;
  content: string;
  kind?: EditableDocumentKind;
  nodeId?: string;
}

export interface FilesystemProvider {
  listDocuments(): Promise<EditableDocument[]>;
  readDocument(documentId: EditableDocumentId): Promise<EditableDocumentContent>;
  writeDocument(documentId: EditableDocumentId, content: string): Promise<EditableDocumentContent>;
  listEditableDocuments(query?: EditableDocumentQuery): Promise<EditableDocument[]>;
  readEditableDocument(
    documentId: EditableDocumentId,
    options?: ReadEditableDocumentOptions
  ): Promise<EditableDocumentContent>;
  writeEditableDocument(input: UpdateEditableDocumentInput): Promise<EditableDocumentContent>;
}
