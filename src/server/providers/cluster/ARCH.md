# cluster
Cluster-aware provider helpers for the agent_1 dashboard backend.
Keeps remote adapter access separate from local provider logic.
Owns composition, remote HTTP calls, and local/remote document routing.
一旦我所属的文件夹有所变化，请更新我。

| file name | position | function |
| --- | --- | --- |
| clusterFilesystemProvider.ts | provider composition | routes document reads and writes to local storage or the remote adapter |
| clusterOpenClawProvider.ts | provider composition | combines local health and agents with remote cluster summaries |
| clusterProviders.test.ts | provider test | verifies cluster-aware provider behavior across local and remote flows |
| createConfiguredProviders.ts | bootstrap helper | builds configured providers from process env and workspace root |
| remoteDashboardAdapterClient.ts | adapter client | calls the agent_2 dashboard adapter HTTP API |
| types.ts | interface module | defines the remote adapter client contract |
