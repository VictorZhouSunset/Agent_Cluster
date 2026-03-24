import { useEffect, useState } from 'react';
import { apiClient } from '../apiClient';
import { Session, Message } from '../types';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { Terminal, User, Bot, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function SessionsScreen() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    apiClient.getSessions().then(s => {
      setSessions(s);
      setLoading(false);
      if (s.length > 0) {
        setSelectedSession(s[0]);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedSession) {
      setLoadingMessages(true);
      apiClient.getSessionMessages(selectedSession.id).then(m => {
        setMessages(m);
        setLoadingMessages(false);
      });
    }
  }, [selectedSession]);

  if (loading) {
    return <div className="p-8 text-zinc-500 font-mono animate-pulse">Loading sessions...</div>;
  }

  return (
    <div className="flex h-full w-full">
      {/* Session List */}
      <div className="w-80 border-r border-white/10 bg-zinc-950/30 flex flex-col">
        <div className="p-4 border-b border-white/5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Active Sessions</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.map(session => (
            <button
              key={session.id}
              onClick={() => setSelectedSession(session)}
              className={cn(
                "w-full text-left p-3 rounded-xl transition-all duration-200",
                selectedSession?.id === session.id
                  ? "bg-indigo-500/10 border border-indigo-500/20"
                  : "hover:bg-white/5 border border-transparent"
              )}
            >
              <div className="font-medium text-sm text-zinc-200 truncate">{session.title}</div>
              <div className="flex items-center justify-between mt-2">
                <SessionStatusBadge status={session.status} />
                <span className="text-[10px] text-zinc-500 font-mono">{format(new Date(session.createdAt), 'HH:mm')}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Session Detail */}
      <div className="flex-1 flex flex-col min-w-0 bg-zinc-950/50 backdrop-blur-sm">
        {selectedSession ? (
          <>
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-medium text-zinc-100">{selectedSession.title}</h1>
                <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500 font-mono">
                  <span className="flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5" /> {selectedSession.id}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {format(new Date(selectedSession.createdAt), 'MMM d, HH:mm:ss')}</span>
                </div>
              </div>
              <SessionStatusBadge status={selectedSession.status} />
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingMessages ? (
                <div className="text-zinc-500 font-mono animate-pulse">Loading messages...</div>
              ) : (
                messages.map(msg => (
                  <MessageBubble key={msg.id} message={msg} />
                ))
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-500 font-mono">
            Select a session to view details
          </div>
        )}
      </div>
    </div>
  );
}

function SessionStatusBadge({ status }: { status: Session['status'] }) {
  const styles = {
    active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    completed: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    failed: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  
  return (
    <span className={cn("px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold border", styles[status])}>
      {status}
    </span>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isAgent = message.role === 'agent';
  const isSystem = message.role === 'system';
  
  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="bg-zinc-900/50 border border-white/5 px-4 py-2 rounded-full text-xs font-mono text-zinc-500">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-4 max-w-3xl", isAgent ? "mr-auto" : "ml-auto flex-row-reverse")}>
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border",
        isAgent ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" : "bg-zinc-800 border-zinc-700 text-zinc-300"
      )}>
        {isAgent ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
      </div>
      <div className={cn(
        "px-5 py-4 rounded-2xl text-sm leading-relaxed",
        isAgent 
          ? "bg-zinc-900/80 border border-white/5 text-zinc-300 rounded-tl-sm" 
          : "bg-indigo-500/10 border border-indigo-500/20 text-indigo-100 rounded-tr-sm"
      )}>
        <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-white/10">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
        <div className={cn("text-[10px] font-mono mt-3 opacity-50", isAgent ? "text-left" : "text-right")}>
          {format(new Date(message.timestamp), 'HH:mm:ss')}
        </div>
      </div>
    </div>
  );
}
