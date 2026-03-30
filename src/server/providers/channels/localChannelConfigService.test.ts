// input: temporary OpenClaw config fixtures plus stubbed reload command execution
// output: provider-level assertions for generic config reads, writes, patches, and Telegram compatibility helpers
// pos: tests for the local OpenClaw config provider
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createLocalChannelConfigService } from "./localChannelConfigService.js";

describe("local channel config service", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  afterEach(() => {
    consoleErrorSpy?.mockRestore();
  });

  it("replaces the local OpenClaw config and reloads the gateway", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "gate-dashboard-openclaw-config-"));
    const configPath = join(rootDir, ".openclaw", "openclaw.json");
    const execCommand = vi.fn().mockResolvedValue(undefined);
    const service = createLocalChannelConfigService({
      homeDir: rootDir,
      execCommand
    });

    const result = await service.replaceOpenClawConfig({
      config: {
        channels: {
          telegram: {
            botToken: "telegram-token-123456"
          }
        }
      }
    });

    const savedConfig = JSON.parse(await readFile(configPath, "utf8"));
    expect(savedConfig.channels.telegram.botToken).toBe("telegram-token-123456");
    expect(execCommand).toHaveBeenCalledWith("openclaw gateway restart");
    expect(result.config.channels).toEqual({
      telegram: {
        botToken: "telegram-token-123456"
      }
    });
  });

  it("applies JSON merge patches and preserves unrelated config", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "gate-dashboard-openclaw-config-"));
    const configPath = join(rootDir, ".openclaw", "openclaw.json");
    const execCommand = vi.fn().mockResolvedValue(undefined);
    await mkdir(join(rootDir, ".openclaw"), { recursive: true });
    await writeFile(
      configPath,
      `${JSON.stringify(
        {
          channels: {
            telegram: {
              botToken: "old-token"
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

    const result = await service.patchOpenClawConfig({
      patch: {
        channels: {
          telegram: null,
          lark: {
            appId: "lark-app-id"
          }
        }
      }
    });

    const savedConfig = JSON.parse(await readFile(configPath, "utf8"));
    expect(savedConfig.channels.telegram).toBeUndefined();
    expect(savedConfig.channels.lark.appId).toBe("lark-app-id");
    expect(savedConfig.appearance.theme).toBe("dark");
    expect(result.config.channels).toEqual({
      lark: {
        appId: "lark-app-id"
      }
    });
  });

  it("supports Telegram apply and clear via compatibility helpers", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "gate-dashboard-openclaw-config-"));
    const configPath = join(rootDir, ".openclaw", "openclaw.json");
    const execCommand = vi.fn().mockResolvedValue(undefined);
    const service = createLocalChannelConfigService({
      homeDir: rootDir,
      execCommand
    });

    await service.applyTelegramChannel({
      botToken: "telegram-token-123456",
      desiredVersion: 2
    });

    let savedConfig = JSON.parse(await readFile(configPath, "utf8"));
    expect(savedConfig.channels.telegram.botToken).toBe("telegram-token-123456");

    await service.clearTelegramChannel();

    savedConfig = JSON.parse(await readFile(configPath, "utf8"));
    expect(savedConfig.channels).toEqual({});
  });

  it("surfaces reload failures after writing the config", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "gate-dashboard-openclaw-config-"));
    const configPath = join(rootDir, ".openclaw", "openclaw.json");
    const reloadError = Object.assign(new Error("reload failed"), {
      stdout: "stdout detail",
      stderr: "stderr detail"
    });
    const execCommand = vi.fn().mockRejectedValue(reloadError);
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const service = createLocalChannelConfigService({
      homeDir: rootDir,
      execCommand
    });

    await expect(
      service.patchOpenClawConfig({
        patch: {
          channels: {
            telegram: {
              botToken: "telegram-token-123456"
            }
          }
        }
      })
    ).rejects.toThrow("reload failed");

    const savedConfig = JSON.parse(await readFile(configPath, "utf8"));
    expect(savedConfig.channels.telegram.botToken).toBe("telegram-token-123456");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("failed to reload OpenClaw gateway after config write"),
      expect.objectContaining({
        configPath,
        reloadCommand: "openclaw gateway restart"
      }),
      expect.objectContaining({
        message: "reload failed",
        stdout: "stdout detail",
        stderr: "stderr detail"
      })
    );
  });
});
