import { Code2, Users, Zap, Shield } from 'lucide-react';
import { useState } from 'react';

export function Comparison() {
  const [activeTab, setActiveTab] = useState(0);

  const useCases = [
    {
      id: 0,
      icon: Code2,
      label: 'Code Generation',
      title: 'AI writes production-ready code',
      description: 'Generate, test, and refine code across multiple languages with intelligent agents.',
      highlights: [
        '20+ programming languages',
        'Built-in documentation'
      ]
    },
    {
      id: 1,
      icon: Users,
      label: 'Team Orchestration',
      title: 'Agents collaborate seamlessly',
      description: 'Coordinate multiple specialized agents that communicate and solve complex problems together.',
      highlights: [
        'Unlimited concurrent agents',
        'Automatic task coordination'
      ]
    },
    {
      id: 2,
      icon: Zap,
      label: 'Instant Execution',
      title: 'Deploy in seconds, not hours',
      description: 'Execute code in secure sandboxes with instant feedback and zero-downtime deployment.',
      highlights: [
        'Sub-100ms execution',
        'Sandboxed environments'
      ]
    },
    {
      id: 3,
      icon: Shield,
      label: 'Enterprise Security',
      title: 'Built-in compliance & protection',
      description: 'Multi-layer security with automated code review and vulnerability scanning.',
      highlights: [
        'SOC 2 & GDPR compliant',
        'Real-time threat detection'
      ]
    }
  ];

  const activeUseCase = useCases[activeTab];
  const ActiveIcon = activeUseCase.icon;

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="max-w-3xl mb-20">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Code that writes itself,
            <span className="text-gray-400"> teams that execute perfectly</span>
          </h2>
          <p className="text-xl text-gray-500 leading-relaxed">
            See how AI agent teams transform every stage of development.
          </p>
        </div>

        {/* Tabs Navigation */}
        <div className="flex flex-wrap gap-3 mb-12">
          {useCases.map((useCase) => {
            const Icon = useCase.icon;
            return (
              <button
                key={useCase.id}
                onClick={() => setActiveTab(useCase.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-full font-medium transition-all duration-300 ${
                  activeTab === useCase.id
                    ? 'bg-slate-700 text-white shadow-lg shadow-slate-700/20'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{useCase.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="relative min-h-[400px]">
          {useCases.map((useCase) => (
            <div
              key={useCase.id}
              className={`transition-all duration-500 ${
                activeTab === useCase.id
                  ? 'opacity-100 relative'
                  : 'opacity-0 absolute inset-0 pointer-events-none'
              }`}
            >
              <div className="bg-gray-50 rounded-3xl p-12 border border-gray-200">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  {/* Left: Content */}
                  <div>
                    <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-cyan-50 mb-6">
                      <ActiveIcon className="w-8 h-8 text-slate-700" />
                    </div>
                    <h3 className="text-4xl font-bold text-gray-900 mb-4">
                      {useCase.title}
                    </h3>
                    <p className="text-lg text-gray-600 leading-relaxed mb-8">
                      {useCase.description}
                    </p>
                    
                    <ul className="space-y-3">
                      {useCase.highlights.map((highlight, idx) => (
                        <li key={idx} className="flex items-center gap-3 text-gray-700">
                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-600"></div>
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Right: Stats */}
                  <div className="grid grid-cols-2 gap-6">
                    {[
                      { label: useCase.id === 0 ? 'Code Accuracy' : useCase.id === 1 ? 'Active Teams' : useCase.id === 2 ? 'Deploy Time' : 'Security Score', value: useCase.id === 0 ? '95%' : useCase.id === 1 ? '2,200+' : useCase.id === 2 ? '<5s' : 'A+' },
                      { label: useCase.id === 0 ? 'Languages' : useCase.id === 1 ? 'Agents' : useCase.id === 2 ? 'Uptime' : 'Compliance', value: useCase.id === 0 ? '20+' : useCase.id === 1 ? '12K+' : useCase.id === 2 ? '99.9%' : 'SOC 2' },
                      { label: useCase.id === 0 ? 'Lines Generated' : useCase.id === 1 ? 'Response Time' : useCase.id === 2 ? 'Requests/sec' : 'Threats Blocked', value: useCase.id === 0 ? '2.5M+' : useCase.id === 1 ? '<50ms' : useCase.id === 2 ? '10K+' : '99.8%' },
                      { label: useCase.id === 0 ? 'Test Coverage' : useCase.id === 1 ? 'Success Rate' : useCase.id === 2 ? 'Auto-scaling' : 'Audits', value: useCase.id === 0 ? '100%' : useCase.id === 1 ? '99%' : useCase.id === 2 ? 'Auto' : 'Daily' }
                    ].map((stat, i) => (
                      <div key={i} className="text-center p-6 bg-white rounded-2xl border border-gray-100">
                        <div className="text-3xl font-bold bg-gradient-to-r from-slate-700 to-cyan-600 bg-clip-text text-transparent mb-2">
                          {stat.value}
                        </div>
                        <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}