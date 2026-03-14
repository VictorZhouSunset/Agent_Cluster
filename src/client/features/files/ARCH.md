# files
Client feature for editing allowlisted markdown files.
Wraps the shared document workspace with file-specific copy and API methods.
Includes integration tests for file save behavior.
一旦我所属的文件夹有所变化，请更新我。

| file name | position | function |
| --- | --- | --- |
| FilesScreen.tsx | feature entrypoint | configures the shared document workspace for files |
| FilesScreen.test.tsx | integration test | verifies file save errors and save-time locking |
