// input: raw HTTP requests plus filesystem and OpenClaw provider dependencies
// output: normalized API routing decisions, structured JSON error responses, and server-side failure logs
// pos: central API router for the dashboard backend
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import type { IncomingMessage, ServerResponse } from "node:http";
import type { ChannelConfigService } from "../providers/channels/types.js";
import type { FilesystemProvider } from "../providers/filesystem/types.js";
import { ReadOnlyDocumentError } from "../providers/filesystem/localFilesystemProvider.js";
import type { OpenClawProvider } from "../providers/openclaw/types.js";
import { handleAgentsRoute } from "./agents.js";
import { handleDocumentsRoute } from "./documents.js";
import { InvalidJsonBodyError } from "./documents.js";
import { handleHealthRoute } from "./health.js";
import {
  handleInternalOpenClawConfigGetRoute,
  handleInternalOpenClawConfigPatchRoute,
  handleInternalOpenClawConfigPutRoute,
  handleInternalOpenClawConfigReloadRoute,
  handleInternalTelegramApplyRoute,
  handleInternalTelegramClearRoute
} from "./internalChannels.js";
import { handleNodesRoute } from "./nodes.js";
import { handleSessionDetailRoute, handleSessionsCollectionRoute } from "./sessions.js";

export interface AppRouterDependencies {
  channelConfigService: ChannelConfigService;
  filesystemProvider: FilesystemProvider;
  internalConfigSecret: string;
  openClawProvider: OpenClawProvider;
}

function serializeErrorForLog(error: unknown) {
  if (error instanceof Error) {
    const details: Record<string, unknown> = {
      name: error.name,
      message: error.message
    };

    if (error.stack) {
      details.stack = error.stack;
    }

    if ("code" in error && error.code) {
      details.code = error.code;
    }

    return details;
  }

  return {
    value: error
  };
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

function isReadOnlyDocumentError(error: unknown): error is ReadOnlyDocumentError {
  return error instanceof ReadOnlyDocumentError;
}

export function createAppRouter(dependencies: AppRouterDependencies) {
  return async (request: IncomingMessage, response: ServerResponse) => {
    const requestUrl = new URL(request.url ?? "/", "http://localhost");
    const pathname = requestUrl.pathname;

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

      if (segments.length === 2 && segments[1] === "nodes" && request.method === "GET") {
        await handleNodesRoute(response, dependencies.openClawProvider);
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

      if (
        segments.length === 3 &&
        segments[1] === "internal" &&
        segments[2] === "openclaw-config" &&
        request.method === "GET"
      ) {
        await handleInternalOpenClawConfigGetRoute(
          request,
          response,
          dependencies.channelConfigService,
          dependencies.internalConfigSecret
        );
        return true;
      }

      if (
        segments.length === 3 &&
        segments[1] === "internal" &&
        segments[2] === "openclaw-config" &&
        request.method === "PUT"
      ) {
        await handleInternalOpenClawConfigPutRoute(
          request,
          response,
          dependencies.channelConfigService,
          dependencies.internalConfigSecret
        );
        return true;
      }

      if (
        segments.length === 3 &&
        segments[1] === "internal" &&
        segments[2] === "openclaw-config" &&
        request.method === "PATCH"
      ) {
        await handleInternalOpenClawConfigPatchRoute(
          request,
          response,
          dependencies.channelConfigService,
          dependencies.internalConfigSecret
        );
        return true;
      }

      if (
        segments.length === 4 &&
        segments[1] === "internal" &&
        segments[2] === "openclaw-config" &&
        segments[3] === "reload" &&
        request.method === "POST"
      ) {
        await handleInternalOpenClawConfigReloadRoute(
          request,
          response,
          dependencies.channelConfigService,
          dependencies.internalConfigSecret
        );
        return true;
      }

      if (
        segments.length === 5 &&
        segments[1] === "internal" &&
        segments[2] === "channels" &&
        segments[3] === "telegram" &&
        segments[4] === "apply" &&
        request.method === "POST"
      ) {
        await handleInternalTelegramApplyRoute(
          request,
          response,
          dependencies.channelConfigService,
          dependencies.internalConfigSecret
        );
        return true;
      }

      if (
        segments.length === 5 &&
        segments[1] === "internal" &&
        segments[2] === "channels" &&
        segments[3] === "telegram" &&
        segments[4] === "clear" &&
        request.method === "POST"
      ) {
        await handleInternalTelegramClearRoute(
          request,
          response,
          dependencies.channelConfigService,
          dependencies.internalConfigSecret
        );
        return true;
      }

      if (segments.length >= 2 && (segments[1] === "files" || segments[1] === "skills")) {
        const documentId = segments.length === 3 ? segments[2] : undefined;
        const kind = segments[1] === "skills" ? "skill" : "file";

        if (segments.length > 3) {
          sendStructuredError(response, 404, "not_found", "Route not found.");
          return true;
        }

        await handleDocumentsRoute(request, response, dependencies.filesystemProvider, {
          kind,
          documentId,
          nodeId: requestUrl.searchParams.get("node") ?? undefined
        });
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

      if (isReadOnlyDocumentError(error)) {
        sendStructuredError(response, 405, "read_only", error.message);
        return true;
      }

      console.error("app router request failed", {
        method: request.method ?? "GET",
        path: pathname
      }, serializeErrorForLog(error));
      sendStructuredError(response, 500, "internal_error", "An unexpected server error occurred.");
      return true;
    }
  };
}
