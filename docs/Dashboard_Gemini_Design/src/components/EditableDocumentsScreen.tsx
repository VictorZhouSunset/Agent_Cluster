import { useState, useEffect } from 'react';
import { Document } from '../types';
import DocumentEditor from './DocumentEditor';
import { cn } from '../lib/utils';
import { FileText } from 'lucide-react';
import { format } from 'date-fns';

interface EditableDocumentsScreenProps {
  documents: Document[];
  onSaveDocument: (docId: string, content: string) => Promise<void>;
  emptyMessage?: string;
}

export default function EditableDocumentsScreen({ documents, onSaveDocument, emptyMessage = "No documents found." }: EditableDocumentsScreenProps) {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  useEffect(() => {
    if (documents.length > 0 && !documents.find(d => d.id === selectedDocId)) {
      setSelectedDocId(documents[0].id);
    }
  }, [documents, selectedDocId]);

  const selectedDoc = documents.find(d => d.id === selectedDocId);

  return (
    <div className="flex h-full w-full">
      {/* Document List */}
      <div className="w-80 border-r border-white/10 bg-zinc-950/30 flex flex-col">
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {documents.length === 0 ? (
            <div className="p-4 text-sm text-zinc-500 font-mono">{emptyMessage}</div>
          ) : (
            documents.map(doc => (
              <button
                key={doc.id}
                onClick={() => setSelectedDocId(doc.id)}
                className={cn(
                  "w-full text-left p-3 rounded-xl transition-all duration-200 flex items-start gap-3",
                  selectedDocId === doc.id
                    ? "bg-indigo-500/10 border border-indigo-500/20"
                    : "hover:bg-white/5 border border-transparent"
                )}
              >
                <FileText className={cn("w-4 h-4 mt-0.5 shrink-0", selectedDocId === doc.id ? "text-indigo-400" : "text-zinc-500")} />
                <div className="min-w-0">
                  <div className="font-mono text-sm text-zinc-200 truncate">{doc.title}</div>
                  <div className="text-[10px] text-zinc-500 mt-1">Updated {format(new Date(doc.updatedAt), 'MMM d, HH:mm')}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-zinc-950/50 backdrop-blur-sm">
        {selectedDoc ? (
          <DocumentEditor document={selectedDoc} onSave={(content) => onSaveDocument(selectedDoc.id, content)} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-500 font-mono">
            Select a document to view or edit
          </div>
        )}
      </div>
    </div>
  );
}
