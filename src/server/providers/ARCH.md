# providers
Backend data-source boundary for the dashboard.
Separates local filesystem edits, OpenClaw runtime reads, and cluster adapter composition.
Subfolders hold concrete provider modules and their tests.
一旦我所属的文件夹有所变化，请更新我。

| file name | position | function |
| --- | --- | --- |
| cluster/ | provider module | cluster-aware provider composition and remote adapter client helpers |
| filesystem/ | provider module | allowlisted editable document provider and tests |
| openclaw/ | provider module | normalized OpenClaw runtime provider and tests |
