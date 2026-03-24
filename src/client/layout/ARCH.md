# layout
Shared client layout primitives for the dashboard shell.
Keeps navigation shell responsibilities out of feature screens while hosting the Grotesque-led dark application frame.
Includes shell-level rendering tests.
一旦我所属的文件夹有所变化，请更新我。

| file name | position | function |
| --- | --- | --- |
| AppShell.tsx | layout component | renders the branded sidebar, support copy, section header, and main application frame |
| AppShell.test.tsx | layout test | verifies the shell renders the active dashboard section plus the branded copy wrappers used by the visual system |
