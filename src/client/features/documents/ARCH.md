# documents
Reusable document-editing building blocks for multiple client features.
Keeps the editor widget and shared list/detail workspace together.
Tests here focus on editor-specific behavior.
一旦我所属的文件夹有所变化，请更新我。

| file name | position | function |
| --- | --- | --- |
| DocumentEditor.tsx | shared editor component | renders markdown editing controls and status feedback |
| EditableDocumentsScreen.tsx | shared workspace component | orchestrates list/detail/save flows for editable documents |
| DocumentEditor.test.tsx | focused test file | covers editor-only save and save-lock behavior |
