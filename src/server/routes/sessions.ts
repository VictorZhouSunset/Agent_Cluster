// input: HTTP response object, OpenClaw provider data, and optional session ids
// output: JSON payloads for session list and session detail endpoints
// pos: route handlers for normalized session browsing responses
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import type { ServerResponse } from "node:http";
import type { OpenClawProvider } from "../providers/openclaw/types.js";
import { sendJson } from "./appRouter.js";

export async function handleSessionsCollectionRoute(response: ServerResponse, provider: OpenClawProvider) {
  const sessions = await provider.listSessions();
  sendJson(response, 200, { data: sessions });
}

export async function handleSessionDetailRoute(
  response: ServerResponse,
  provider: OpenClawProvider,
  sessionId: string
) {
  const session = await provider.getSession(sessionId);

  if (!session) {
    sendJson(response, 404, {
      error: {
        code: "not_found",
        message: `Session "${sessionId}" was not found.`
      }
    });
    return;
  }

  sendJson(response, 200, { data: session });
}
