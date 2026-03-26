// input: authenticated internal channel apply/clear requests for the local node
// output: structured Telegram channel config apply and clear responses
// pos: internal-only channel configuration route handlers for gateway orchestration
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import type { IncomingMessage, ServerResponse } from "node:http";
import type { ChannelConfigService } from "../providers/channels/types.js";
import { InvalidJsonBodyError } from "./documents.js";
import { sendJson } from "./appRouter.js";

async function readJsonBody(request: IncomingMessage) {
  return new Promise<Record<string, unknown>>((resolve, reject) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>);
      } catch {
        reject(new InvalidJsonBodyError());
      }
    });
    request.on("error", reject);
  });
}

function readSecretHeader(request: IncomingMessage) {
  const header = request.headers["x-openmoose-internal-secret"];

  if (Array.isArray(header)) {
    return header[0] ?? "";
  }

  return header ?? "";
}

export async function handleInternalTelegramApplyRoute(
  request: IncomingMessage,
  response: ServerResponse,
  channelConfigService: ChannelConfigService,
  expectedSecret: string
) {
  if (!expectedSecret || readSecretHeader(request) !== expectedSecret) {
    sendJson(response, 403, {
      error: {
        code: "forbidden",
        message: "Invalid internal channel configuration secret."
      }
    });
    return;
  }

  const body = await readJsonBody(request);
  const botToken = typeof body.botToken === "string" ? body.botToken : "";
  const desiredVersion =
    typeof body.desiredVersion === "number" && Number.isFinite(body.desiredVersion)
      ? body.desiredVersion
      : 1;

  if (!botToken.trim()) {
    sendJson(response, 400, {
      error: {
        code: "invalid_request",
        message: "Telegram bot token is required."
      }
    });
    return;
  }

  const result = await channelConfigService.applyTelegramChannel({
    botToken,
    desiredVersion
  });

  sendJson(response, 200, {
    data: result
  });
}

export async function handleInternalTelegramClearRoute(
  request: IncomingMessage,
  response: ServerResponse,
  channelConfigService: ChannelConfigService,
  expectedSecret: string
) {
  if (!expectedSecret || readSecretHeader(request) !== expectedSecret) {
    sendJson(response, 403, {
      error: {
        code: "forbidden",
        message: "Invalid internal channel configuration secret."
      }
    });
    return;
  }

  const result = await channelConfigService.clearTelegramChannel();
  sendJson(response, 200, {
    data: result
  });
}
