// input: channel tokens plus desired version and local runtime apply intent
// output: structured apply and clear results for internal dashboard orchestration
// pos: contract for local conversation-channel configuration services
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
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
  applyTelegramChannel(input: ApplyTelegramChannelInput): Promise<ApplyTelegramChannelResult>;
  clearTelegramChannel(): Promise<ClearTelegramChannelResult>;
}
