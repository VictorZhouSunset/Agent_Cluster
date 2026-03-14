# scripts
Automation scripts for the software-dev skill.
Used as executable gates for ADR indexing and docs validation.
Designed for deterministic command-line use.
一旦我所属的文件夹有所变化，请更新我。

| file name | position | function |
| --- | --- | --- |
| adr_index.py | index generator | build docs/adr/index.md from ADR files |
| docscheck.py | validator | enforce file-header and ARCH.md contracts |
| green_checkpoint.py | checkpoint recorder | append all-green checkpoint entry for rollback anchor |
| ARCH.md | local contract | minimal folder architecture and file map |
