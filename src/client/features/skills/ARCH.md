# skills
Client feature for editing allowlisted skill markdown files.
Wraps the node-scoped document workspace with skill-specific copy and the redesigned split-pane document surfaces.
Includes integration tests for rendered skill preview, edit/save behavior, and node switching.
一旦我所属的文件夹有所变化，请更新我。

| file name | position | function |
| --- | --- | --- |
| SkillsScreen.tsx | feature entrypoint | configures the node-scoped document workspace for skills |
| SkillsScreen.test.tsx | integration test | verifies skill preview mode, saves, save-time locking, and node switching |
