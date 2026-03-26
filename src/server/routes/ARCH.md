# routes
HTTP route layer for the dashboard backend.
Maps normalized providers onto `/api/*` endpoints with structured errors.
Keeps route concerns separate from provider logic.
一旦我所属的文件夹有所变化，请更新我。

| file name | position | function |
| --- | --- | --- |
| agents.ts | endpoint handler | serves normalized agent status data |
| appRouter.ts | central router | dispatches API requests and maps shared errors |
| appRouter.test.ts | router test | verifies API responses and route-level error handling |
| documents.ts | endpoint handler | serves editable file and skill list/detail/save flows |
| health.ts | endpoint handler | serves normalized dashboard health data |
| internalChannels.ts | endpoint handlers | serves internal-only Telegram config apply and clear routes |
| nodes.ts | endpoint handler | serves cluster node inventory for overview and document scoping |
| sessions.ts | endpoint handlers | serves session collection and session detail responses |
