# client
React frontend for the Gate dashboard.
Owns screen composition, navigation, and browser-side data access.
Feature folders hold the main user-facing workflows.
一旦我所属的文件夹有所变化，请更新我。

| file name | position | function |
| --- | --- | --- |
| App.tsx | root component | selects the active dashboard feature screen |
| main.tsx | bootstrap entry | mounts the React app in the browser |
| features/ | feature area | screen flows and shared document UI |
| layout/ | shell area | top-level application layout |
| lib/ | client support | browser-side API access helpers |
