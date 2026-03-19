# openclaw
OpenClaw-facing runtime data layer for the backend.
Normalizes health, node, agent, and session reads behind one provider boundary.
Current implementation supports local stubbed adapter behavior.
一旦我所属的文件夹有所变化，请更新我。

| file name | position | function |
| --- | --- | --- |
| localOpenClawProvider.ts | provider implementation | returns normalized runtime data and local node inventory for backend routes |
| localOpenClawProvider.test.ts | provider test | verifies stubbed runtime data and node inventory contracts |
| types.ts | interface module | defines provider and adapter contracts for OpenClaw data and node inventory |
