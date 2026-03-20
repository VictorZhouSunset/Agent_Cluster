# openclaw
OpenClaw-facing runtime data layer for the backend.
Normalizes health, node, agent, and session reads behind one provider boundary.
Current implementation keeps local health/node/agent stubs while reading sessions from the local OpenClaw session store when a home directory is configured.
一旦我所属的文件夹有所变化，请更新我。

| file name | position | function |
| --- | --- | --- |
| localOpenClawProvider.ts | provider implementation | returns normalized runtime data and local node inventory for backend routes, with filesystem-backed session reads |
| localOpenClawProvider.test.ts | provider test | verifies stubbed runtime data plus local OpenClaw session-store reads |
| localSessionStore.ts | session adapter | reads sessions.json and transcript jsonl files into normalized dashboard session models |
| types.ts | interface module | defines provider and adapter contracts for OpenClaw data, node inventory, and local session-store options |
