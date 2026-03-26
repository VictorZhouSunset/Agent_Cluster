// input: temporary OpenClaw config fixtures plus stubbed reload command execution
// output: provider-level assertions for Telegram apply/clear behavior
// pos: tests for the local channel configuration provider
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createLocalChannelConfigService } from "./localChannelConfigService.js";

describe("local channel config service", () => {
  it("writes Telegram bot tokens into the local OpenClaw config and reloads the gateway", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "gate-dashboard-telegram-config-"));
    const configPath = join(rootDir, ".openclaw", "openclaw.json");
    const execCommand = vi.fn().mockResolvedValue(undefined);
    const service = createLocalChannelConfigService({
      homeDir: rootDir,
      execCommand
    });

    const result = await service.applyTelegramChannel({
      botToken: "telegram-token-123456",
      desiredVersion: 2
    });

    const savedConfig = JSON.parse(await readFile(configPath, "utf8"));
    expect(savedConfig.channels.telegram.botToken).toBe("telegram-token-123456");
    expect(execCommand).toHaveBeenCalledWith("openclaw gateway restart");
    expect(result).toMatchObject({
      channelType: "telegram",
      applyStatus: "connected",
      desiredVersion: 2,
      appliedVersion: 2
    });
  });

  it("clears the Telegram bot token and preserves unrelated OpenClaw config", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "gate-dashboard-telegram-config-"));
    const configPath = join(rootDir, ".openclaw", "openclaw.json");
    const execCommand = vi.fn().mockResolvedValue(undefined);
    await mkdir(join(rootDir, ".openclaw"), { recursive: true });
    await writeFile(
      configPath,
      `${JSON.stringify(
        {
          channels: {
            telegram: {
              botToken: "telegram-token-123456"
            }
          },
          appearance: {
            theme: "dark"
          }
        },
        null,
        2
      )}\n`,
      "utf8"
    );
    const service = createLocalChannelConfigService({
      homeDir: rootDir,
      execCommand
    });

    const result = await service.clearTelegramChannel();

    const savedConfig = JSON.parse(await readFile(configPath, "utf8"));
    expect(savedConfig.channels).toBeUndefined();
    expect(savedConfig.appearance.theme).toBe("dark");
    expect(execCommand).toHaveBeenCalledWith("openclaw gateway restart");
    expect(result).toMatchObject({
      channelType: "telegram",
      applyStatus: "not_connected"
    });
  });

  it("surfaces reload failures after writing the config", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "gate-dashboard-telegram-config-"));
    const configPath = join(rootDir, ".openclaw", "openclaw.json");
    const execCommand = vi.fn().mockRejectedValue(new Error("reload failed"));
    const service = createLocalChannelConfigService({
      homeDir: rootDir,
      execCommand
    });

    await expect(
      service.applyTelegramChannel({
        botToken: "telegram-token-123456"
      })
    ).rejects.toThrow("reload failed");

    const savedConfig = JSON.parse(await readFile(configPath, "utf8"));
    expect(savedConfig.channels.telegram.botToken).toBe("telegram-token-123456");
  });
});
