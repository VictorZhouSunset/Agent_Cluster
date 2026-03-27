// input: OpenClaw config documents, merge patches, reload intents, and Telegram compatibility writes
// output: structured local config read/write/reload results for internal dashboard orchestration
// pos: contract for local OpenClaw config services
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
export type OpenClawConfigDocument = Record<string, unknown>;

export interface GetOpenClawConfigResult {
  config: OpenClawConfigDocument;
  configPath: string;
}

export interface ReplaceOpenClawConfigInput {
  config: OpenClawConfigDocument;
}

export interface PatchOpenClawConfigInput {
  patch: OpenClawConfigDocument;
}

export interface UpdateOpenClawConfigResult {
  config: OpenClawConfigDocument;
  configPath: string;
  reloadedAt: string;
}

export interface ReloadOpenClawConfigResult {
  configPath: string;
  reloadedAt: string;
}

export interface ApplyTelegramChannelInput {
  botToken: string;
  desiredVersion?: number;
}

export interface ApplyTelegramChannelResult {
  channelType: "telegram";
  applyStatus: "connected";
  desiredVersion: number;
  appliedVersion: number;
  configPath: string;
}

export interface ClearTelegramChannelResult {
  channelType: "telegram";
  applyStatus: "not_connected";
  configPath: string;
}

export interface ChannelConfigService {
  getOpenClawConfig(): Promise<GetOpenClawConfigResult>;
  replaceOpenClawConfig(input: ReplaceOpenClawConfigInput): Promise<UpdateOpenClawConfigResult>;
  patchOpenClawConfig(input: PatchOpenClawConfigInput): Promise<UpdateOpenClawConfigResult>;
  reloadOpenClawConfig(): Promise<ReloadOpenClawConfigResult>;
  applyTelegramChannel(input: ApplyTelegramChannelInput): Promise<ApplyTelegramChannelResult>;
  clearTelegramChannel(): Promise<ClearTelegramChannelResult>;
}
