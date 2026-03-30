// input: local OpenClaw config documents, merge patches, Telegram example writes, and reload command execution
// output: persisted OpenClaw config plus structured read/write/reload results
// pos: concrete local OpenClaw config provider for the gate dashboard
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import { exec as execCallback } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import type {
  ApplyTelegramChannelInput,
  ApplyTelegramChannelResult,
  ChannelConfigService,
  ClearTelegramChannelResult,
  OpenClawConfigDocument,
  ReloadOpenClawConfigResult,
  UpdateOpenClawConfigResult
} from "./types.js";

export interface LocalChannelConfigServiceOptions {
  homeDir: string;
  configPath?: string;
  reloadCommand?: string;
  execCommand?: (command: string) => Promise<void>;
}

async function readOpenClawConfig(configPath: string): Promise<OpenClawConfigDocument> {
  try {
    const raw = await readFile(configPath, "utf8");
    const parsed = JSON.parse(raw) as unknown;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("OpenClaw config root must be a JSON object.");
    }

    return parsed as OpenClawConfigDocument;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return {};
    }

    throw error;
  }
}

function ensureObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {};
}

function applyJsonMergePatch(target: unknown, patch: unknown): unknown {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    return patch;
  }

  const base = ensureObject(target);

  for (const [key, value] of Object.entries(patch as Record<string, unknown>)) {
    if (value === null) {
      delete base[key];
      continue;
    }

    if (value && typeof value === "object" && !Array.isArray(value)) {
      base[key] = applyJsonMergePatch(base[key], value);
      continue;
    }

    base[key] = value;
  }

  return base;
}

async function writeOpenClawConfig(configPath: string, config: OpenClawConfigDocument) {
  await mkdir(dirname(configPath), { recursive: true });
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

function resolveConfigPath(homeDir: string, configPath?: string) {
  return configPath ?? join(homeDir, ".openclaw", "openclaw.json");
}

function defaultExecCommand(command: string) {
  return promisify(execCallback)(command).then(() => undefined);
}

function buildDefaultReloadCommand() {
  return "bash -lc 'if [ -f \"$HOME/.nvm/nvm.sh\" ]; then . \"$HOME/.nvm/nvm.sh\" >/dev/null 2>&1; fi; openclaw gateway restart'";
}

export function createLocalChannelConfigService({
  homeDir,
  configPath,
  reloadCommand = buildDefaultReloadCommand(),
  execCommand = defaultExecCommand
}: LocalChannelConfigServiceOptions): ChannelConfigService {
  const resolvedConfigPath = resolveConfigPath(homeDir, configPath);

  async function reloadGateway(): Promise<ReloadOpenClawConfigResult> {
    await execCommand(reloadCommand);

    return {
      configPath: resolvedConfigPath,
      reloadedAt: new Date().toISOString()
    };
  }

  async function persistConfig(config: OpenClawConfigDocument): Promise<UpdateOpenClawConfigResult> {
    await writeOpenClawConfig(resolvedConfigPath, config);
    const reloadResult = await reloadGateway();

    return {
      config,
      configPath: resolvedConfigPath,
      reloadedAt: reloadResult.reloadedAt
    };
  }

  return {
    async getOpenClawConfig() {
      const config = await readOpenClawConfig(resolvedConfigPath);

      return {
        config,
        configPath: resolvedConfigPath
      };
    },

    async replaceOpenClawConfig({ config }) {
      if (!config || typeof config !== "object" || Array.isArray(config)) {
        throw new Error("OpenClaw config must be a JSON object.");
      }

      return persistConfig({ ...(config as OpenClawConfigDocument) });
    },

    async patchOpenClawConfig({ patch }) {
      if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
        throw new Error("OpenClaw config patch must be a JSON object.");
      }

      const currentConfig = await readOpenClawConfig(resolvedConfigPath);
      const nextConfig = applyJsonMergePatch(currentConfig, patch);

      if (!nextConfig || typeof nextConfig !== "object" || Array.isArray(nextConfig)) {
        throw new Error("OpenClaw config patch must produce a JSON object.");
      }

      return persistConfig(nextConfig as OpenClawConfigDocument);
    },

    async reloadOpenClawConfig() {
      return reloadGateway();
    },

    async applyTelegramChannel(input: ApplyTelegramChannelInput): Promise<ApplyTelegramChannelResult> {
      const botToken = input.botToken.trim();

      if (!botToken) {
        throw new Error("Telegram bot token is required.");
      }

      await this.patchOpenClawConfig({
        patch: {
          channels: {
            telegram: {
              botToken
            }
          }
        }
      });

      return {
        channelType: "telegram",
        applyStatus: "connected",
        desiredVersion: input.desiredVersion ?? 1,
        appliedVersion: input.desiredVersion ?? 1,
        configPath: resolvedConfigPath
      };
    },

    async clearTelegramChannel(): Promise<ClearTelegramChannelResult> {
      await this.patchOpenClawConfig({
        patch: {
          channels: {
            telegram: null
          }
        }
      });

      return {
        channelType: "telegram",
        applyStatus: "not_connected",
        configPath: resolvedConfigPath
      };
    }
  };
}
