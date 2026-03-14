// input: HTTP response object and OpenClaw provider access to health data
// output: JSON payload for the /api/health endpoint
// pos: route handler for normalized dashboard health responses
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import type { ServerResponse } from "node:http";
import type { OpenClawProvider } from "../providers/openclaw/types.js";
import { sendJson } from "./appRouter.js";

export async function handleHealthRoute(response: ServerResponse, provider: OpenClawProvider) {
  const health = await provider.getHealth();
  sendJson(response, 200, { data: health });
}
