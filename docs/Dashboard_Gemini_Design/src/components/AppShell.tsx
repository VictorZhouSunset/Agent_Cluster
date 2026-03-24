import { ReactNode } from 'react';
import { LayoutDashboard, MessageSquare, Wrench, Folder, Activity } from 'lucide-react';
import { cn } from '../lib/utils';
import { Section } from '../App';

interface AppShellProps {
  currentSection: Section;
  onSectionChange: (section: Section) => void;
  children: ReactNode;
}

export default function AppShell({ currentSection, onSectionChange, children }: AppShellProps) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'sessions', label: 'Sessions', icon: MessageSquare },
    { id: 'skills', label: 'Skills', icon: Wrench },
    { id: 'files', label: 'Files', icon: Folder },
  ] as const;

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-zinc-950/50 backdrop-blur-xl flex flex-col z-20">
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="font-semibold tracking-wide text-sm uppercase text-zinc-300">Cluster Ops</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                currentSection === item.id
                  ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5 text-xs text-zinc-600 font-mono">
          v2.4.1-stable
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/5 blur-[120px] pointer-events-none rounded-full" />
        <div className="flex-1 overflow-y-auto z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
