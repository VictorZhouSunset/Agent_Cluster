# documents
Reusable document-editing building blocks for multiple client features.
Keeps the editor widget, shared workspace, and node selector together.
The shared editor now defaults to rendered Markdown preview and switches into an in-card edit mode for writes.
Tests here focus on preview/edit transitions, width-safe editor layout, and document-workspace behavior.
一旦我所属的文件夹有所变化，请更新我。

| file name | position | function |
| --- | --- | --- |
| DocumentEditor.tsx | shared editor component | renders Markdown preview plus edit, cancel, save, and status controls |
| EditableDocumentsScreen.tsx | shared workspace component | orchestrates list/detail/save flows and keeps the editor column width-safe |
| NodeScopedDocumentsScreen.tsx | shared workspace wrapper | scopes document editing to the selected local or remote node |
| DocumentEditor.test.tsx | focused test file | covers preview/edit transitions, save behavior, and width-safe editor styles |
