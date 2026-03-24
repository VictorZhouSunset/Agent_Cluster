import { useEffect, useState } from 'react';
import { apiClient } from '../apiClient';
import { Node, Agent } from '../types';
import { Server, Cpu, MemoryStick, Activity, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function OverviewScreen() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiClient.getNodes(), apiClient.getAgents()]).then(([n, a]) => {
      setNodes(n);
      setAgents(a);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="p-8 text-zinc-500 font-mono animate-pulse">Loading cluster state...</div>;
  }

  const onlineNodes = nodes.filter(n => n.status === 'online').length;
  const activeAgents = agents.filter(a => a.status === 'busy').length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-light tracking-tight text-zinc-100">Cluster Overview</h1>
        <p className="text-zinc-500 mt-2 text-sm">Real-time operational status of the agent network.</p>
      </header>

      {/* Health Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="Nodes Online" value={`${onlineNodes}/${nodes.length}`} icon={Server} status={onlineNodes === nodes.length ? 'good' : 'warning'} />
        <MetricCard title="Active Agents" value={`${activeAgents}/${agents.length}`} icon={Activity} status="neutral" />
        <MetricCard title="Cluster Load" value={`${Math.round(nodes.reduce((acc, n) => acc + n.cpu, 0) / nodes.length)}%`} icon={Cpu} status="neutral" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Node List */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Infrastructure Nodes</h2>
          <div className="bg-zinc-900/50 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
            {nodes.map((node, i) => (
              <div key={node.id} className={cn("p-4 flex items-center justify-between", i !== nodes.length - 1 && "border-b border-white/5")}>
                <div className="flex items-center gap-4">
                  <div className={cn("w-2 h-2 rounded-full shadow-[0_0_8px]", node.status === 'online' ? "bg-emerald-500 shadow-emerald-500/50" : "bg-amber-500 shadow-amber-500/50")} />
                  <div>
                    <div className="font-mono text-sm text-zinc-200">{node.name}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">up {node.uptime}</div>
                  </div>
                </div>
                <div className="flex gap-6 text-xs font-mono text-zinc-400">
                  <div className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5" /> {node.cpu}%</div>
                  <div className="flex items-center gap-1.5"><MemoryStick className="w-3.5 h-3.5" /> {node.memory}%</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Agent List */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Active Agents</h2>
          <div className="bg-zinc-900/50 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
            {agents.map((agent, i) => (
              <div key={agent.id} className={cn("p-4 flex items-center justify-between", i !== agents.length - 1 && "border-b border-white/5")}>
                <div>
                  <div className="font-medium text-sm text-zinc-200">{agent.name}</div>
                  <div className="text-xs text-zinc-500 mt-0.5 font-mono">Node: {nodes.find(n => n.id === agent.nodeId)?.name || agent.nodeId}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500">{agent.lastActive}</span>
                  <AgentStatusBadge status={agent.status} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, status }: { title: string, value: string, icon: any, status: 'good' | 'warning' | 'neutral' }) {
  return (
    <div className="bg-zinc-900/50 border border-white/10 p-6 rounded-2xl flex items-center gap-4 backdrop-blur-sm relative overflow-hidden">
      <div className={cn("absolute top-0 left-0 w-1 h-full", status === 'good' ? 'bg-emerald-500' : status === 'warning' ? 'bg-amber-500' : 'bg-indigo-500')} />
      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
        <Icon className="w-6 h-6 text-zinc-400" />
      </div>
      <div>
        <div className="text-sm text-zinc-400 font-medium">{title}</div>
        <div className="text-2xl font-light text-zinc-100 mt-1">{value}</div>
      </div>
    </div>
  );
}

function AgentStatusBadge({ status }: { status: Agent['status'] }) {
  const styles = {
    idle: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    busy: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    error: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  
  return (
    <span className={cn("px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-semibold border", styles[status])}>
      {status}
    </span>
  );
}
