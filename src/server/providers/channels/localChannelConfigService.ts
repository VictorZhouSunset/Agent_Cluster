// input: local OpenClaw config documents, merge patches, Telegram example writes, and reload command execution
// output: persisted OpenClaw config, structured read/write/reload results, and reload failure logs
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

const DEFAULT_OPENCLAW_RELOAD_COMMAND =
  "env XDG_RUNTIME_DIR=/run/user/1000 DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus systemctl --user restart openclaw-gateway.service";

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

function serializeReloadError(error: unknown) {
  if (error instanceof Error) {
    const details: Record<string, unknown> = {
      name: error.name,
      message: error.message
    };

    if (error.stack) {
      details.stack = error.stack;
    }

    if ("stdout" in error && typeof error.stdout === "string" && error.stdout.trim()) {
      details.stdout = error.stdout;
    }

    if ("stderr" in error && typeof error.stderr === "string" && error.stderr.trim()) {
      details.stderr = error.stderr;
    }

    if ("code" in error && error.code) {
      details.code = error.code;
    }

    return details;
  }

  return {
    value: error
  };
}

export function createLocalChannelConfigService({
  homeDir,
  configPath,
  reloadCommand = DEFAULT_OPENCLAW_RELOAD_COMMAND,
  execCommand = defaultExecCommand
}: LocalChannelConfigServiceOptions): ChannelConfigService {
  const resolvedConfigPath = resolveConfigPath(homeDir, configPath);

  async function reloadGateway(): Promise<ReloadOpenClawConfigResult> {
    try {
      await execCommand(reloadCommand);
    } catch (error) {
      console.error(
        "failed to reload OpenClaw gateway after config write",
        {
          configPath: resolvedConfigPath,
          reloadCommand
        },
        serializeReloadError(error)
      );
      throw error;
    }

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
