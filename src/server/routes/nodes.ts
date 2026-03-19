// input: node summary reads from the OpenClaw provider boundary
// output: normalized node metadata response for the dashboard overview and document scoping
// pos: dedicated API route handler for cluster node inventory
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import type { ServerResponse } from "node:http";
import type { OpenClawProvider } from "../providers/openclaw/types.js";
import { sendJson } from "./appRouter.js";

export async function handleNodesRoute(
  response: ServerResponse,
  openClawProvider: OpenClawProvider
) {
  const nodes = await openClawProvider.listNodes();
  sendJson(response, 200, { data: nodes });
}
