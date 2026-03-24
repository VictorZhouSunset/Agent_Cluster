import { useState } from 'react';
import { ChevronLeft, Check, Zap } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router';

export function Dashboard() {
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      name: 'Air',
      price: billingPeriod === 'monthly' ? 99 : billingPeriod === 'yearly' ? 79 : 25,
      period: billingPeriod === 'monthly' ? '/Month' : billingPeriod === 'yearly' ? '/Month' : '/Week',
      description: 'Individual Freelancer',
      recommended: false,
      features: [
        '1 AI employee instance',
        'Standard computing',
        'Basic skill packages',
        'All channels (Telegram, Lark, Slack, etc.)',
        'Email support',
        '24/7 availability'
      ],
      cta: 'Start Free Trial',
      ctaSubtext: '3 days FREE',
      openclew: 'One-click deploy, fully managed'
    },
    {
      name: 'Pro',
      price: billingPeriod === 'monthly' ? 449 : billingPeriod === 'yearly' ? 359 : 115,
      period: billingPeriod === 'monthly' ? '/Month' : billingPeriod === 'yearly' ? '/Month' : '/Week',
      description: 'Startup Team',
      recommended: true,
      features: [
        '1 AI employee instance',
        'Advanced computing (larger context, stronger reasoning)',
        'Complete skill packages',
        'All channels (Telegram, Lark, Slack, etc.)',
        'Priority support (24h response)'
      ],
      cta: 'Subscribe Now',
      openclew: 'One-click deploy, fully managed'
    },
    {
      name: 'Ultra',
      price: billingPeriod === 'monthly' ? 999 : billingPeriod === 'yearly' ? 799 : 255,
      period: billingPeriod === 'monthly' ? '/Month' : billingPeriod === 'yearly' ? '/Month' : '/Week',
      description: 'Growing Business',
      recommended: false,
      features: [
        'Up to 3 AI employee instances',
        'Premium computing + extended quota',
        'Custom skill package support',
        'Dedicated Customer Success Manager',
        'Priority support (4h response)'
      ],
      cta: 'Subscribe Now',
      openclew: 'One-click deploy, fully managed'
    },
    {
      name: 'Enterprise',
      price: null,
      period: 'Custom',
      description: 'Starting at $2,000/mo',
      recommended: false,
      features: [
        'Private Deployment, Unlimited Scale',
        'Unlimited instances',
        'Private deployment options',
        'Deep integration development',
        'All warranties',
        'SSO/SAML',
        'Starting at $1,000/mo'
      ],
      cta: 'Contact Sales',
      openclew: 'One-click deploy, fully managed'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/30 pt-32 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Back button */}
        <a 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-16 transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Dashboard
        </a>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl md:text-6xl font-light text-gray-900 mb-5">
            Choose your plan
          </h1>
          <p className="text-lg md:text-xl text-gray-500 font-light">
            Select a plan to hire an AI employee
          </p>
        </div>

        {/* Billing period toggle */}
        <div className="flex items-center justify-center gap-3 mb-14">
          <button
            onClick={() => setBillingPeriod('weekly')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              billingPeriod === 'weekly'
                ? 'bg-slate-800 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              billingPeriod === 'monthly'
                ? 'bg-slate-800 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Monthly
          </button>
          <div className="relative">
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingPeriod === 'yearly'
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              Yearly
            </button>
            <span className="absolute -top-3 -right-2 bg-gradient-to-r from-cyan-500 to-teal-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
              SAVE 20%
            </span>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-3xl border-2 p-7 transition-all hover:shadow-xl hover:-translate-y-1 ${
                plan.recommended
                  ? 'border-cyan-500 shadow-lg shadow-cyan-500/10'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              {/* Recommended badge */}
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-cyan-500 to-teal-600 text-white text-xs px-4 py-1.5 rounded-full font-semibold flex items-center gap-1 shadow-md">
                    <Zap className="w-3 h-3 fill-white" />
                    Recommended
                  </span>
                </div>
              )}

              {/* Icon placeholder - using gradient circle */}
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-teal-600/20 rounded-2xl flex items-center justify-center mb-5 mx-auto">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-600 to-teal-700 rounded-xl flex items-center justify-center text-white text-xl font-bold">
                  {plan.name.charAt(0)}
                </div>
              </div>

              {/* Plan name */}
              <h3 className="text-2xl font-semibold text-gray-900 text-center mb-2">
                {plan.name}
              </h3>

              {/* Price */}
              <div className="text-center mb-1">
                {plan.price !== null ? (
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-light text-gray-900">${plan.price}</span>
                    <span className="text-gray-500 ml-1 text-sm">{plan.period}</span>
                  </div>
                ) : (
                  <div className="text-3xl font-light text-gray-900">{plan.period}</div>
                )}
              </div>

              {/* Description */}
              <p className="text-center text-xs text-gray-500 mb-6">
                {plan.description}
              </p>

              {/* Features */}
              <ul className="space-y-2.5 mb-6">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-gray-700 leading-relaxed">
                    <Check className="w-3.5 h-3.5 text-cyan-600 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* OpenClew badge */}
              <div className="flex items-center gap-2 mb-5 pb-5 border-b border-gray-100">
                <div className="w-4 h-4 bg-gradient-to-br from-cyan-600 to-slate-800 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-[10px] font-bold">O</span>
                </div>
                <span className="text-[10px] text-gray-500 leading-tight">
                  OpenClew — {plan.openclew}
                </span>
              </div>

              {/* CTA Button */}
              <div className="space-y-1.5">
                <Button
                  className={`w-full rounded-full font-medium h-11 text-sm transition-all ${
                    plan.recommended
                      ? 'bg-slate-800 hover:bg-slate-900 text-white shadow-lg shadow-slate-800/20'
                      : 'bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200'
                  }`}
                  onClick={() => {
                    if (plan.cta === 'Subscribe Now' || plan.cta === 'Start Free Trial') {
                      navigate('/subscribe', { state: { plan: plan.name, price: plan.price } });
                    } else if (plan.cta === 'Contact Sales') {
                      // Handle contact sales action
                      window.location.href = 'mailto:sales@openmoose.ai';
                    }
                  }}
                >
                  {plan.cta}
                </Button>
                {plan.ctaSubtext && (
                  <p className="text-center text-[10px] text-cyan-600 font-medium">
                    {plan.ctaSubtext}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-sm text-gray-500 leading-relaxed max-w-2xl mx-auto">
          All trial can change plans trial.<br />
          If not cancelled, subscription renews automatically after trial.
        </p>
      </div>
    </div>
  );
}