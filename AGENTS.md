\# AGENTS.md



\## Environment



\- Target OS: Ubuntu 24.04 LTS  

&#x20; Reference: https://discourse.ubuntu.com/t/ubuntu-24-04-lts-noble-numbat-release-notes/39890

\- Target Node.js: 24  

&#x20; Reference: https://docs.openclaw.ai/install/node

\- Target OpenClaw version: 2026.3.11  

&#x20; Reference: https://github.com/openclaw/openclaw/releases

\- This project is developed for Linux EC2 first, not for local desktop first without Linux or Openclaw, so you cannot test e2e and don't need to do so now



\## Task scope



Build a custom Dashboard for the Gate node.



The Dashboard must read local OpenClaw data and provide:



\- health

\- sessions

\- skills

\- selected markdown files



The first version of the Dashboard must support:



\- viewing Agent status

\- viewing Session list and Session content

\- viewing and editing Skills

\- viewing and editing selected markdown files



\## Architecture rules



\- The Dashboard runs on the same EC2 as OpenClaw

\- The Dashboard listens on port 3000

\- OpenClaw must not be exposed directly to the public internet

\- End users must not access port 3000 directly

\- Public traffic should go through the entry server and reverse proxy



\## Data rules



\- Read OpenClaw runtime state from local OpenClaw interfaces

\- Treat OpenClaw as the source of truth for session and health data  

&#x20; Reference: https://docs.openclaw.ai/concepts/session

\- Skills and selected markdown files may be edited carefully  

&#x20; Reference: https://docs.openclaw.ai/tools/skills

\- Do not directly modify raw session transcript/store files unless explicitly requested



\## File scope



Editable files may include:



\- SOUL.md

\- USER.md

\- AGENTS.md

\- TOOLS.md

\- skills/\*/SKILL.md



\## Change rules



\- Keep changes minimal and targeted

\- Do not introduce billing, cluster provisioning, or unrelated AWS logic

\- Do not add OpenClaw built-in dashboard integration unless explicitly requested

\- Prefer implementation that works cleanly on Ubuntu Linux



\## Dependency tools



\- Use pnpm for this Dashboard project

\- Do not introduce uv unless a real Python subproject is added



\## Validation



After code changes:



1\. install dependencies

2\. run lint if present

3\. run typecheck if present

4\. run build if present

5\. report failures clearly



\## References



\- Codex AGENTS.md guide: https://developers.openai.com/codex/guides/agents-md/

\- OpenClaw install docs: https://docs.openclaw.ai/install

\- OpenClaw Node docs: https://docs.openclaw.ai/install/node

\- OpenClaw Linux docs: https://docs.openclaw.ai/platforms/linux

\- OpenClaw releases: https://github.com/openclaw/openclaw/releases

\- Ubuntu 24.04 LTS release notes: https://discourse.ubuntu.com/t/ubuntu-24-04-lts-noble-numbat-release-notes/39890

