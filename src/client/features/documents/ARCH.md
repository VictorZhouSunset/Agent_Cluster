# documents
Reusable document-editing building blocks for multiple client features.
Keeps the editor widget, shared workspace, and node selector together.
The shared editor defaults to rendered Markdown preview and now sits inside the same dark split-pane language used by the rest of the dashboard.
Tests here focus on preview/edit transitions, structural wrappers, and width-safe editor layout.
一旦我所属的文件夹有所变化，请更新我。

| file name | position | function |
| --- | --- | --- |
| DocumentEditor.tsx | shared editor component | renders the document header plus preview/edit/save controls in the redesigned surface |
| EditableDocumentsScreen.tsx | shared workspace component | orchestrates the split-pane document list/detail/save workflow |
| NodeScopedDocumentsScreen.tsx | shared workspace wrapper | scopes document editing to the selected local or remote node with a styled selector |
| DocumentEditor.test.tsx | focused test file | covers preview/edit transitions, save behavior, and contained editor layout |
