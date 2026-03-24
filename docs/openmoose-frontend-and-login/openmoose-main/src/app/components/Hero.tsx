import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router';

export function Hero() {
  const navigate = useNavigate();
  
  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-white">
      {/* Decorative elements */}
      <div className="absolute top-32 right-10 w-72 h-72 bg-gradient-to-br from-slate-200 to-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-gradient-to-tr from-cyan-200 to-slate-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
      
      <div className="max-w-6xl mx-auto relative">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-full px-4 py-2 mb-10">
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
            <span className="text-sm font-medium text-slate-700">
              Introducing Agent Platform
            </span>
          </div>

          <h1 className="text-6xl md:text-7xl lg:text-8xl font-semibold mb-8 leading-tight tracking-tight">
            The AI-native
            <br />
            <span className="bg-gradient-to-r from-slate-700 via-cyan-600 to-slate-700 bg-clip-text text-transparent">
              team infrastructure
            </span>
          </h1>
          
          <p className="text-gray-500 text-xl md:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed font-light">
            Build intelligent agent teams that work together seamlessly.
            <br />
            Deploy in minutes, scale infinitely.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-cyan-500 to-teal-600 hover:shadow-lg hover:shadow-cyan-500/30 text-white px-8 py-6 text-base rounded-full group"
              onClick={() => navigate('/signup')}
            >
              Start building
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg" 
              variant="ghost"
              className="text-gray-600 hover:text-gray-900 px-8 py-6 text-base rounded-full"
              onClick={() => navigate('/demo')}
            >
              Schedule a demo
            </Button>
          </div>
        </div>

        {/* Hero illustration/mockup */}
        <div className="relative max-w-5xl mx-auto">
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 backdrop-blur-sm bg-white/90">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'Agent Teams', value: '2,200+', color: 'from-slate-600 to-slate-700' },
                { label: 'Active Agents', value: '12K+', color: 'from-cyan-600 to-teal-600' },
                { label: 'API Calls', value: '5M+', color: 'from-slate-600 to-cyan-600' },
                { label: 'Uptime', value: '99.9%', color: 'from-teal-600 to-cyan-600' }
              ].map((stat, i) => (
                <div key={i} className="text-center p-6 bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl border border-gray-100">
                  <div className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}>
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}