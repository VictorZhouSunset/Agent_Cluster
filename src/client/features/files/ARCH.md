# files
Client feature for editing allowlisted markdown files.
Wraps the node-scoped document workspace with file-specific copy and API methods.
Includes integration tests for file save behavior and node switching.
一旦我所属的文件夹有所变化，请更新我。

| file name | position | function |
| --- | --- | --- |
| FilesScreen.tsx | feature entrypoint | configures the node-scoped document workspace for files |
| FilesScreen.test.tsx | integration test | verifies file save errors, save-time locking, and node switching |
