// input: configured provider bootstrap inputs and a temporary OpenClaw home layout
// output: assertions that configured providers read sessions from the local OpenClaw runtime store
// pos: bootstrap-level tests for provider wiring from environment roots into backend services
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { createConfiguredProviders } from "./createConfiguredProviders";

describe("configured providers", () => {
  it("wires the local OpenClaw session store into the cluster provider", async () => {
    const homeDir = await mkdtemp(join(tmpdir(), "gate-dashboard-configured-providers-"));
    const sessionId = "c15e4bff-2348-4b8a-85ec-70858847996d";
    const sessionsDir = join(homeDir, ".openclaw", "agents", "main", "sessions");

    try {
      await mkdir(sessionsDir, { recursive: true });
      await writeFile(
        join(sessionsDir, "sessions.json"),
        JSON.stringify(
          {
            main: {
              sessionId,
              updatedAt: "2026-03-19T18:10:00.000Z",
              createdAt: "2026-03-19T18:00:00.000Z"
            }
          },
          null,
          2
        ),
        "utf8"
      );
      await writeFile(
        join(sessionsDir, `${sessionId}.jsonl`),
        `${JSON.stringify({
          type: "message",
          id: "message-1",
          role: "assistant",
          content: "Session is live.",
          createdAt: "2026-03-19T18:10:00.000Z"
        })}\n`,
        "utf8"
      );

      const providers = createConfiguredProviders(homeDir, { HOME: homeDir });

      await expect(providers.openClawProvider.listSessions()).resolves.toEqual([
        expect.objectContaining({
          id: sessionId,
          nodeName: "OpenMoose03_CIO"
        })
      ]);
      await expect(providers.openClawProvider.getSession(sessionId)).resolves.toEqual(
        expect.objectContaining({
          id: sessionId,
          messages: [
            expect.objectContaining({
              id: "message-1",
              content: "Session is live."
            })
          ]
        })
      );
    } finally {
      await rm(homeDir, { recursive: true, force: true });
    }
  });
});
