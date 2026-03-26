// input: local OpenClaw home/config paths, Telegram bot token writes, and reload command execution
// output: persisted Telegram channel config plus structured apply/clear results
// pos: concrete local channel configuration provider for the gate dashboard
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import { exec as execCallback } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import type {
  ApplyTelegramChannelInput,
  ApplyTelegramChannelResult,
  ChannelConfigService,
  ClearTelegramChannelResult
} from "./types.js";

export interface LocalChannelConfigServiceOptions {
  homeDir: string;
  configPath?: string;
  reloadCommand?: string;
  execCommand?: (command: string) => Promise<void>;
}

async function readOpenClawConfig(configPath: string) {
  try {
    const raw = await readFile(configPath, "utf8");
    return JSON.parse(raw) as Record<string, unknown>;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return {};
    }

    throw error;
  }
}

function ensureObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? { ...(value as Record<string, unknown>) } : {};
}

function cleanupEmptyBranches(config: Record<string, unknown>) {
  const channels = ensureObject(config.channels);
  const telegram = ensureObject(channels.telegram);

  if (Object.keys(telegram).length === 0) {
    delete channels.telegram;
  }

  if (Object.keys(channels).length === 0) {
    delete config.channels;
  } else {
    config.channels = channels;
  }

  return config;
}

async function writeOpenClawConfig(configPath: string, config: Record<string, unknown>) {
  await mkdir(dirname(configPath), { recursive: true });
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

function resolveConfigPath(homeDir: string, configPath?: string) {
  return configPath ?? join(homeDir, ".openclaw", "openclaw.json");
}

function defaultExecCommand(command: string) {
  return promisify(execCallback)(command).then(() => undefined);
}

export function createLocalChannelConfigService({
  homeDir,
  configPath,
  reloadCommand = "openclaw gateway restart",
  execCommand = defaultExecCommand
}: LocalChannelConfigServiceOptions): ChannelConfigService {
  const resolvedConfigPath = resolveConfigPath(homeDir, configPath);

  async function reloadGateway() {
    await execCommand(reloadCommand);
  }

  return {
    async applyTelegramChannel(input: ApplyTelegramChannelInput): Promise<ApplyTelegramChannelResult> {
      const botToken = input.botToken.trim();

      if (!botToken) {
        throw new Error("Telegram bot token is required.");
      }

      const config = await readOpenClawConfig(resolvedConfigPath);
      const channels = ensureObject(config.channels);
      const telegram = ensureObject(channels.telegram);

      telegram.botToken = botToken;
      channels.telegram = telegram;
      config.channels = channels;

      await writeOpenClawConfig(resolvedConfigPath, config);
      await reloadGateway();

      return {
        channelType: "telegram",
        applyStatus: "connected",
        desiredVersion: input.desiredVersion ?? 1,
        appliedVersion: input.desiredVersion ?? 1,
        configPath: resolvedConfigPath
      };
    },

    async clearTelegramChannel(): Promise<ClearTelegramChannelResult> {
      const config = await readOpenClawConfig(resolvedConfigPath);
      const channels = ensureObject(config.channels);
      const telegram = ensureObject(channels.telegram);

      delete telegram.botToken;
      channels.telegram = telegram;
      config.channels = channels;

      await writeOpenClawConfig(resolvedConfigPath, cleanupEmptyBranches(config));
      await reloadGateway();

      return {
        channelType: "telegram",
        applyStatus: "not_connected",
        configPath: resolvedConfigPath
      };
    }
  };
}
