# shared
Cross-layer dashboard contracts shared by client and server.
Keeps DTOs stable between the browser and backend code paths.
Tests here protect the public shape of those contracts.
一旦我所属的文件夹有所变化，请更新我。

| file name | position | function |
| --- | --- | --- |
| types.ts | contract module | defines shared health, session, agent, and document types |
| types.test.ts | contract test | verifies the expected shared DTO shapes |
