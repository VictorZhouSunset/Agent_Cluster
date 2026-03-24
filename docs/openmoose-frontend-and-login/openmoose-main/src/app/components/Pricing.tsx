import { Check, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';

const plans = [
  {
    name: 'Starter',
    price: '$99',
    period: '/month',
    description: 'Perfect for individuals and small teams exploring AI agents.',
    features: [
      '5 active agents',
      '1,000 requests/month',
      'Basic analytics',
      'Community support',
      'API access'
    ],
    cta: 'Start free trial',
    popular: false
  },
  {
    name: 'Pro',
    price: '$449',
    period: '/month',
    description: 'For growing teams building production AI systems.',
    features: [
      '25 active agents',
      '10,000 requests/month',
      'Advanced analytics',
      'Priority support',
      'Custom integrations',
      'Team collaboration',
      'Version control'
    ],
    cta: 'Start free trial',
    popular: true
  },
  {
    name: 'Ultra',
    price: '$990',
    period: '/month',
    description: 'For teams with demanding workflows and high volume.',
    features: [
      '100 active agents',
      '50,000 requests/month',
      'Real-time analytics',
      'Dedicated support',
      'White-label options',
      'Advanced security',
      'SLA guarantee'
    ],
    cta: 'Start free trial',
    popular: false
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'Unlimited scale with dedicated infrastructure.',
    features: [
      'Unlimited agents',
      'Unlimited requests',
      'Custom analytics',
      '24/7 phone support',
      'On-premise deployment',
      'Custom contracts'
    ],
    cta: 'Contact sales',
    popular: false
  }
];

export function Pricing() {
  return (
    <section id="pricing" className="py-32 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Pricing that scales
            <span className="text-gray-400"> with you</span>
          </h2>
          <p className="text-xl text-gray-500 mb-10">
            Start free, upgrade as you grow. No hidden fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`rounded-3xl transition-all duration-300 ${
                plan.popular 
                  ? 'bg-gradient-to-br from-cyan-500 to-teal-600 p-[3px] shadow-xl' 
                  : 'bg-white border border-gray-200 hover:border-slate-300 hover:shadow-lg'
              }`}
            >
              <div className={`p-8 h-full ${plan.popular ? 'bg-white rounded-[calc(1.5rem-3px)]' : ''}`}>
                {plan.popular && (
                  <div className="inline-flex px-3 py-1 bg-gradient-to-r from-cyan-500 to-teal-600 text-white text-xs font-semibold rounded-full mb-6">
                    MOST POPULAR
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="font-bold text-xl mb-3 text-gray-900">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-5xl font-bold text-slate-800">{plan.price}</span>
                    {plan.period && <span className="text-gray-500 text-base">{plan.period}</span>}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{plan.description}</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.popular ? 'text-slate-700' : 'text-gray-900'}`} />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className={`w-full rounded-full py-6 font-medium transition-all group ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-cyan-500 to-teal-600 hover:shadow-lg hover:shadow-cyan-500/30 text-white' 
                      : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300'
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>

                {index < 3 && (
                  <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                    <span className="text-xs text-gray-500">14-day free trial • No credit card required</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}