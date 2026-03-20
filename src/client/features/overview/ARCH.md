# overview
Client feature for high-level dashboard health, node, and agent summaries.
Reads read-only overview data from the internal API and presents it as an operations dashboard without synthetic telemetry.
Includes focused screen-state tests for the cluster overview.
一旦我所属的文件夹有所变化，请更新我。

| file name | position | function |
| --- | --- | --- |
| OverviewScreen.tsx | feature entrypoint | renders health hero, node cards, and agent cards from real backend fields |
| OverviewScreen.test.tsx | screen test | verifies overview loading, error, and structured success rendering |
