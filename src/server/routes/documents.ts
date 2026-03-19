// input: document route requests, JSON request bodies, and filesystem provider access
// output: list/detail/save responses for allowlisted skill and file documents
// pos: shared route handler for editable dashboard documents
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import type { IncomingMessage, ServerResponse } from "node:http";
import type { EditableDocumentKind } from "../../shared/types.js";
import type { FilesystemProvider } from "../providers/filesystem/types.js";
import { sendJson } from "./appRouter.js";

interface DocumentRouteOptions {
  kind: EditableDocumentKind;
  documentId?: string;
  nodeId?: string;
}

interface WriteDocumentBody {
  content: string;
}

export class InvalidJsonBodyError extends Error {
  constructor() {
    super("Request body must be valid JSON.");
    this.name = "InvalidJsonBodyError";
  }
}

function toRouteDocumentId(kind: EditableDocumentKind, rawDocumentId: string) {
  return kind === "skill" ? `skill:${rawDocumentId}` : rawDocumentId;
}

function isWriteDocumentBody(value: unknown): value is WriteDocumentBody {
  return typeof value === "object" && value !== null && "content" in value && typeof value.content === "string";
}

async function readJsonBody(request: IncomingMessage) {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  if (chunks.length === 0) {
    return null;
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new InvalidJsonBodyError();
    }

    throw error;
  }
}

export async function handleDocumentsRoute(
  request: IncomingMessage,
  response: ServerResponse,
  provider: FilesystemProvider,
  options: DocumentRouteOptions
) {
  const method = request.method ?? "GET";

  if (method === "GET" && options.documentId === undefined) {
    const documents = await provider.listEditableDocuments({
      kind: options.kind,
      nodeId: options.nodeId
    });
    sendJson(response, 200, { data: documents.filter((document) => document.kind === options.kind) });
    return;
  }

  if (options.documentId === undefined) {
    sendJson(response, 405, {
      error: {
        code: "method_not_allowed",
        message: `Method ${method} is not allowed for this endpoint.`
      }
    });
    return;
  }

  const documentId = toRouteDocumentId(options.kind, options.documentId);

  if (method === "GET") {
    const document = await provider.readEditableDocument(documentId, {
      kind: options.kind,
      nodeId: options.nodeId
    });
    sendJson(response, 200, { data: document });
    return;
  }

  if (method === "PUT") {
    const body = await readJsonBody(request);

    if (!isWriteDocumentBody(body)) {
      sendJson(response, 400, {
        error: {
          code: "invalid_body",
          message: 'Expected JSON body with a string "content" field.'
        }
      });
      return;
    }

    const document = await provider.writeEditableDocument({
      id: documentId,
      kind: options.kind,
      nodeId: options.nodeId,
      content: body.content
    });

    sendJson(response, 200, { data: document });
    return;
  }

  sendJson(response, 405, {
    error: {
      code: "method_not_allowed",
      message: `Method ${method} is not allowed for this endpoint.`
    }
  });
}
