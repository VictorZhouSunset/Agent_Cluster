# server
Node backend for the Gate dashboard.
Combines API routing, local and remote provider composition, and client asset serving.
Keeps client build output behind a single HTTP entrypoint.
一旦我所属的文件夹有所变化，请更新我。

| file name | position | function |
| --- | --- | --- |
| app.ts | request entrypoint | composes API handling with configured providers, static asset serving, and SPA responses |
| app.test.ts | request test | verifies API/static/spa server behavior |
| index.ts | bootstrap entry | resolves port and starts the HTTP server |
| index.test.ts | bootstrap test | verifies startup helpers without opening a real listener |
| providers/ | data layer | local filesystem and OpenClaw provider implementations |
| routes/ | HTTP layer | normalized API route handlers and routing helpers |
