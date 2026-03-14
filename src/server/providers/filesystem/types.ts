// input: editable document ids and content updates issued by route handlers
// output: provider contracts for listing, reading, and writing allowlisted documents
// pos: filesystem provider interface shared across server layers
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import type {
  EditableDocument,
  EditableDocumentContent,
  EditableDocumentId
} from "../../../shared/types.js";

export interface UpdateEditableDocumentInput {
  id: EditableDocumentId;
  content: string;
}

export interface FilesystemProvider {
  listDocuments(): Promise<EditableDocument[]>;
  readDocument(documentId: EditableDocumentId): Promise<EditableDocumentContent>;
  writeDocument(documentId: EditableDocumentId, content: string): Promise<EditableDocumentContent>;
  listEditableDocuments(): Promise<EditableDocument[]>;
  readEditableDocument(documentId: EditableDocumentId): Promise<EditableDocumentContent>;
  writeEditableDocument(input: UpdateEditableDocumentInput): Promise<EditableDocumentContent>;
}
