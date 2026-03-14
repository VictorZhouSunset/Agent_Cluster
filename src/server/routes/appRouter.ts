// input: raw HTTP requests plus filesystem and OpenClaw provider dependencies
// output: normalized API routing decisions and structured JSON error responses
// pos: central API router for the dashboard backend
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import type { IncomingMessage, ServerResponse } from "node:http";
import type { FilesystemProvider } from "../providers/filesystem/types.js";
import type { OpenClawProvider } from "../providers/openclaw/types.js";
import { handleAgentsRoute } from "./agents.js";
import { handleDocumentsRoute } from "./documents.js";
import { InvalidJsonBodyError } from "./documents.js";
import { handleHealthRoute } from "./health.js";
import { handleSessionDetailRoute, handleSessionsCollectionRoute } from "./sessions.js";

export interface AppRouterDependencies {
  filesystemProvider: FilesystemProvider;
  openClawProvider: OpenClawProvider;
}

export function sendJson(response: ServerResponse, statusCode: number, payload: unknown) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(payload));
}

function sendStructuredError(response: ServerResponse, statusCode: number, code: string, message: string) {
  sendJson(response, statusCode, {
    error: {
      code,
      message
    }
  });
}

function normalizePathSegments(pathname: string) {
  return pathname.split("/").filter(Boolean).map(decodeURIComponent);
}

export function isApiPath(pathname: string) {
  return pathname === "/api" || pathname.startsWith("/api/");
}

function isMissingError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

function isAllowlistError(error: unknown) {
  return error instanceof Error && /not allowlisted/i.test(error.message);
}

function isInvalidPathError(error: unknown): error is URIError {
  return error instanceof URIError;
}

function isInvalidJsonBodyError(error: unknown): error is InvalidJsonBodyError {
  return error instanceof InvalidJsonBodyError;
}

export function createAppRouter(dependencies: AppRouterDependencies) {
  return async (request: IncomingMessage, response: ServerResponse) => {
    const pathname = new URL(request.url ?? "/", "http://localhost").pathname;

    if (!isApiPath(pathname)) {
      return false;
    }

    try {
      const segments = normalizePathSegments(pathname);

      if (segments.length === 2 && segments[1] === "health" && request.method === "GET") {
        await handleHealthRoute(response, dependencies.openClawProvider);
        return true;
      }

      if (segments.length === 2 && segments[1] === "agents" && request.method === "GET") {
        await handleAgentsRoute(response, dependencies.openClawProvider);
        return true;
      }

      if (segments.length === 2 && segments[1] === "sessions" && request.method === "GET") {
        await handleSessionsCollectionRoute(response, dependencies.openClawProvider);
        return true;
      }

      if (segments.length === 3 && segments[1] === "sessions" && request.method === "GET") {
        await handleSessionDetailRoute(response, dependencies.openClawProvider, segments[2]);
        return true;
      }

      if (segments.length >= 2 && (segments[1] === "files" || segments[1] === "skills")) {
        const documentId = segments.length === 3 ? segments[2] : undefined;
        const kind = segments[1] === "skills" ? "skill" : "file";

        if (segments.length > 3) {
          sendStructuredError(response, 404, "not_found", "Route not found.");
          return true;
        }

        await handleDocumentsRoute(request, response, dependencies.filesystemProvider, { kind, documentId });
        return true;
      }

      sendStructuredError(response, 404, "not_found", "Route not found.");
      return true;
    } catch (error) {
      if (isInvalidPathError(error)) {
        sendStructuredError(response, 400, "invalid_path", "Request path must be validly encoded.");
        return true;
      }

      if (isInvalidJsonBodyError(error)) {
        sendStructuredError(response, 400, "invalid_json", "Request body must be valid JSON.");
        return true;
      }

      if (isAllowlistError(error) || isMissingError(error)) {
        sendStructuredError(response, 404, "not_found", "Requested resource was not found.");
        return true;
      }

      sendStructuredError(response, 500, "internal_error", "An unexpected server error occurred.");
      return true;
    }
  };
}
