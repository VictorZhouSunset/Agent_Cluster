# lib
Small client-side support layer for feature screens.
Centered on typed API access plus presentation-only formatting helpers.
Includes local and remote-node aware HTTP helpers for the dashboard.
一旦我所属的文件夹有所变化，请更新我。

| file name | position | function |
| --- | --- | --- |
| apiClient.ts | data access helper | wraps dashboard HTTP endpoints with typed methods, node scoping, and normalized errors |
| formatters.ts | presentation helper | formats backend timestamps for overview, sessions, and document metadata |
