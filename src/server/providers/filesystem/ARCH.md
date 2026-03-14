# filesystem
Allowlisted document storage layer for the backend.
Owns id validation, path resolution, and local file reads/writes.
Tests here cover guardrails and provider behavior.
一旦我所属的文件夹有所变化，请更新我。

| file name | position | function |
| --- | --- | --- |
| allowlist.ts | guard module | resolves editable ids into safe relative file targets |
| allowlist.test.ts | guard test | verifies allowlist acceptance and rejection cases |
| constants.ts | config module | declares fixed editable files and skill id rules |
| localFilesystemProvider.ts | provider implementation | lists, reads, and writes allowlisted local documents |
| localFilesystemProvider.test.ts | provider test | verifies local document read/write behavior |
| types.ts | interface module | defines backend filesystem provider contracts |
