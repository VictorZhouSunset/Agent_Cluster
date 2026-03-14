# software-dev
Executable skill for AI-led software delivery.
Defines phases, triggers, gates, and reporting.
References scripts that enforce documentation contracts.
一旦我所属的文件夹有所变化，请更新我。

| file name | position | function |
| --- | --- | --- |
| SKILL.md | skill spec | workflow, triggers, rollback, completion criteria |
| scripts/adr_index.py | automation utility | generate docs/adr/index.md from ADR files |
| scripts/docscheck.py | automation utility | validate file headers and ARCH.md contracts |
| scripts/green_checkpoint.py | automation utility | append deterministic green checkpoint records |
| ARCH.md | local contract | minimal folder architecture and file map |
