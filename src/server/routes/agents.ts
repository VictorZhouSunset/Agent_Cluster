// input: HTTP response object and OpenClaw provider access to agent status data
// output: JSON payload for the /api/agents endpoint
// pos: route handler for normalized agent status responses
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import type { ServerResponse } from "node:http";
import type { OpenClawProvider } from "../providers/openclaw/types.js";
import { sendJson } from "./appRouter.js";

export async function handleAgentsRoute(response: ServerResponse, provider: OpenClawProvider) {
  const agents = await provider.listAgents();
  sendJson(response, 200, { data: agents });
}
