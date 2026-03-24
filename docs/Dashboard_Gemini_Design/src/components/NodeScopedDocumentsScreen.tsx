import { useEffect, useState } from 'react';
import { apiClient } from '../apiClient';
import { Node, Document } from '../types';
import EditableDocumentsScreen from './EditableDocumentsScreen';
import { Server } from 'lucide-react';

interface NodeScopedDocumentsScreenProps {
  title: string;
  fetchDocuments: (nodeId: string) => Promise<Document[]>;
  updateDocument: (nodeId: string, docId: string, content: string) => Promise<Document>;
}

export default function NodeScopedDocumentsScreen({ title, fetchDocuments, updateDocument }: NodeScopedDocumentsScreenProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(false);

  useEffect(() => {
    apiClient.getNodes().then(n => {
      setNodes(n);
      setLoading(false);
      if (n.length > 0) {
        setSelectedNodeId(n[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedNodeId) {
      setLoadingDocs(true);
      fetchDocuments(selectedNodeId).then(docs => {
        setDocuments(docs);
        setLoadingDocs(false);
      });
    }
  }, [selectedNodeId, fetchDocuments]);

  const handleSave = async (docId: string, content: string) => {
    if (!selectedNodeId) return;
    const updatedDoc = await updateDocument(selectedNodeId, docId, content);
    setDocuments(docs => docs.map(d => d.id === docId ? updatedDoc : d));
  };

  if (loading) {
    return <div className="p-8 text-zinc-500 font-mono animate-pulse">Loading nodes...</div>;
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header & Node Selector */}
      <div className="p-4 border-b border-white/10 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between z-10">
        <h1 className="text-lg font-medium text-zinc-100">{title}</h1>
        <div className="flex items-center gap-3">
          <Server className="w-4 h-4 text-zinc-500" />
          <select
            value={selectedNodeId || ''}
            onChange={(e) => setSelectedNodeId(e.target.value)}
            className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-zinc-200 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            {nodes.map(node => (
              <option key={node.id} value={node.id}>{node.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Workspace */}
      <div className="flex-1 min-h-0 relative">
        {loadingDocs ? (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-500 font-mono animate-pulse">
            Loading documents...
          </div>
        ) : (
          <EditableDocumentsScreen 
            documents={documents} 
            onSaveDocument={handleSave} 
            emptyMessage={`No ${title.toLowerCase()} found on this node.`}
          />
        )}
      </div>
    </div>
  );
}
