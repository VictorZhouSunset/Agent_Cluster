# channels
Provider layer for applying and clearing conversation-channel configuration on the local node.
Owns the last-mile write to local OpenClaw config plus the required reload command.
一旦我所属的文件夹有所变化，请更新我。

| file name | position | function |
| --- | --- | --- |
| localChannelConfigService.ts | provider implementation | writes Telegram config into local OpenClaw config and reloads the gateway |
| localChannelConfigService.test.ts | provider test | verifies apply, clear, and reload failure handling |
| types.ts | provider contract | defines the channel config service interface |
