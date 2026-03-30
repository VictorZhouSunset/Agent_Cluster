# channels
Provider layer for reading, replacing, patching, and reloading local OpenClaw config on the node.
Telegram remains the first compatibility example, but the provider itself is now config-oriented.
一旦我所属的文件夹有所变化，请更新我。

| file name | position | function |
| --- | --- | --- |
| localChannelConfigService.ts | provider implementation | reads and updates local OpenClaw config, supports merge patches, reloads the gateway, and logs reload failures |
| localChannelConfigService.test.ts | provider test | verifies replace, patch, Telegram compatibility helpers, and reload failure logging |
| types.ts | provider contract | defines the generic OpenClaw config service interface and Telegram compatibility methods |
