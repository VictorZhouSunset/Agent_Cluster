# features
User-facing dashboard feature modules.
Each subfolder owns one screen or one shared feature primitive.
Navigation metadata lives here because it binds the feature set together.
一旦我所属的文件夹有所变化，请更新我。

| file name | position | function |
| --- | --- | --- |
| navigation.ts | shared feature config | declares the dashboard sections and lookup helpers |
| documents/ | shared feature module | reusable document editing UI and related tests |
| files/ | feature module | allowlisted markdown file screen and tests |
| overview/ | feature module | health and agent overview screen and tests |
| sessions/ | feature module | session browser screen and tests |
| skills/ | feature module | skill editing screen and tests |
