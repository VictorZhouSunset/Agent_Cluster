import { Bot, Boxes, Zap, BarChart3 } from 'lucide-react';

const features = [
  {
    icon: Bot,
    title: 'Pre-built agent library',
    description: 'Start with battle-tested agents or customize your own. Ready to integrate with your tools.'
  },
  {
    icon: Boxes,
    title: 'Team orchestration',
    description: 'Create sophisticated workflows where specialized agents collaborate seamlessly.'
  },
  {
    icon: Zap,
    title: 'Instant deployment',
    description: 'From prototype to production in seconds. Scale automatically with demand.'
  },
  {
    icon: BarChart3,
    title: 'Real-time insights',
    description: 'Monitor performance, costs, and collaboration patterns across your entire team.'
  }
];

export function Features() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl mb-20">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Everything you need to build
            <span className="text-gray-400"> intelligent teams</span>
          </h2>
          <p className="text-xl text-gray-500 leading-relaxed">
            Powerful primitives that make building with AI agents feel natural.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="group bg-white rounded-3xl p-10 border border-gray-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300"
            >
              <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-cyan-50 group-hover:from-slate-100 group-hover:to-cyan-100 mb-6 transition-colors">
                <feature.icon className="w-7 h-7 text-slate-700 group-hover:text-slate-800 transition-colors" />
              </div>
              <h3 className="font-bold text-2xl mb-4 text-gray-900">{feature.title}</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}