import { useState, useEffect } from 'react';
import { Document } from '../types';
import ReactMarkdown from 'react-markdown';
import { Edit2, Save, X } from 'lucide-react';

interface DocumentEditorProps {
  document: Document;
  onSave: (content: string) => Promise<void>;
}

export default function DocumentEditor({ document, onSave }: DocumentEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(document.content);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setContent(document.content);
    setIsEditing(false);
  }, [document.id]);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(content);
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setContent(document.content);
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-zinc-950/50">
        <h2 className="text-lg font-medium text-zinc-100 font-mono">{document.title}</h2>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-500 hover:bg-indigo-400 text-white transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-white/5 hover:bg-white/10 text-zinc-200 transition-colors"
            >
              <Edit2 className="w-4 h-4" /> Edit
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-zinc-950/30">
        {isEditing ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full min-h-[500px] bg-zinc-900/50 border border-white/10 rounded-xl p-4 text-zinc-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
            spellCheck={false}
          />
        ) : (
          <div className="prose prose-invert max-w-none prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-white/10 prose-headings:font-medium">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
