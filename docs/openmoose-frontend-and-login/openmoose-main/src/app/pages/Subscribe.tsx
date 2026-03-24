import { useState } from 'react';
import { ChevronLeft, Check, Lock, Zap, Shield, X, ExternalLink, Globe, AlertCircle, MessageSquare, Mail, Hash, Bot, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate, useLocation } from 'react-router';

interface SubscribeProps {
  plan?: 'Pro' | 'Ultra' | 'Mega';
  price?: number;
}

export function Subscribe({ plan: defaultPlan = 'Pro', price: defaultPrice = 449 }: SubscribeProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { plan?: string; price?: number } | null;
  
  const plan = state?.plan || defaultPlan;
  const price = state?.price || defaultPrice;
  
  const [currentStep, setCurrentStep] = useState(2); // Starting at PAYMENT step
  const [isWaitingPayment, setIsWaitingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [domain, setDomain] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [assistantName, setAssistantName] = useState('Zylos');
  const [welcomeMessage, setWelcomeMessage] = useState('Hi! How can I help you today?');

  const steps = [
    { id: 1, label: 'PLAN', completed: currentStep > 1 },
    { id: 2, label: 'PAYMENT', completed: currentStep > 2 },
    { id: 3, label: 'DOMAIN', completed: currentStep > 3 },
    { id: 4, label: 'CHANNEL', completed: currentStep > 4 },
    { id: 5, label: 'SETUP', completed: currentStep > 5 },
    { id: 6, label: 'DONE', completed: currentStep > 6 },
  ];

  const handlePayment = () => {
    // Open Stripe checkout in new window
    window.open('https://checkout.stripe.com/', '_blank');
    // Show waiting state
    setIsWaitingPayment(true);
    
    // Simulate payment success after 5 seconds (in real app, this would be webhook)
    setTimeout(() => {
      setPaymentSuccess(true);
      setIsWaitingPayment(false);
      setCurrentStep(3);
    }, 5000);
  };

  const reopenStripeCheckout = () => {
    window.open('https://checkout.stripe.com/', '_blank');
  };

  const handleDomainContinue = () => {
    if (domain || subdomain) {
      setCurrentStep(4);
    }
  };

  const handleSkipDomain = () => {
    setCurrentStep(4);
  };

  const toggleChannel = (channel: string) => {
    setSelectedChannels(prev => 
      prev.includes(channel) 
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    );
  };

  const handleChannelContinue = () => {
    setCurrentStep(5);
  };

  const handleSetupContinue = () => {
    setCurrentStep(6);
  };

  const handleFinish = () => {
    navigate('/dashboard');
  };

  const channels = [
    {
      id: 'webchat',
      name: 'Web Chat',
      description: 'Embed on your website with our chat widget',
      icon: MessageSquare,
      color: 'from-blue-400 to-blue-500',
      recommended: true
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Connect to your Slack workspace',
      icon: Hash,
      color: 'from-purple-400 to-purple-500',
      recommended: false
    },
    {
      id: 'discord',
      name: 'Discord',
      description: 'Add to your Discord server',
      icon: MessageSquare,
      color: 'from-indigo-400 to-indigo-500',
      recommended: false
    },
    {
      id: 'email',
      name: 'Email',
      description: 'Respond to customer emails automatically',
      icon: Mail,
      color: 'from-cyan-400 to-cyan-500',
      recommended: false
    }
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/30 pt-32 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-16 transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Plan
        </button>

        {/* Progress Steps */}
        <div className="mb-16 max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                {/* Step circle */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      step.completed
                        ? 'bg-gradient-to-br from-cyan-400 to-teal-500 shadow-md shadow-cyan-500/30'
                        : step.id === currentStep
                        ? 'bg-slate-800 shadow-md'
                        : 'bg-slate-200'
                    }`}
                  >
                    {step.completed ? (
                      <Check className="w-6 h-6 text-white" />
                    ) : (
                      <div
                        className={`w-3 h-3 rounded-full ${
                          step.id === currentStep ? 'bg-white' : 'bg-slate-400'
                        }`}
                      />
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium ${
                      step.id === currentStep
                        ? 'text-slate-900'
                        : step.completed
                        ? 'text-cyan-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connecting line */}
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded-full transition-all ${
                      step.completed ? 'bg-gradient-to-r from-cyan-400 to-teal-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content - Narrower container */}
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-light text-gray-900 mb-6 leading-tight">
              Ready to wake up your AI employee
            </h1>

            {/* Plan info */}
            <div className="inline-flex flex-col items-center gap-2 mb-12">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <div className="w-6 h-6 bg-white/90 transform rotate-45" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}></div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-gray-900">{plan} Plan</div>
                <div className="text-lg text-gray-600">${price}/monthly</div>
                <div className="text-sm text-gray-500">Assistant: Zylos</div>
              </div>
            </div>
          </div>

          {/* Payment Card */}
          {currentStep === 2 && !isWaitingPayment && (
            <div className="bg-white rounded-3xl border-2 border-gray-100 p-8 mb-8 shadow-sm">
              {/* Payment Method */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Payment Method
                </h2>
                <div className="border-2 border-gray-900 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                  </div>
                  <span className="text-gray-900 font-medium">Pay with credit card</span>
                </div>
              </div>

              {/* Subscription Details */}
              <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-600">Subscription</span>
                  <span className="text-gray-900 font-semibold">{plan} Plan</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Billing cycle</span>
                  <span className="text-gray-900 font-semibold">Monthly</span>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-200">
                <span className="text-lg font-semibold text-gray-900">Total due today</span>
                <span className="text-3xl font-bold text-gray-900">${price}</span>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="flex items-start gap-2">
                  <Zap className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-600">
                    Instant activation — deployed in minutes
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <X className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-600">
                    Cancel anytime, no long-term commitment
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Shield className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-600">
                    Dedicated support team
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Lock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-600">
                    Secured by Stripe
                  </div>
                </div>
              </div>

              {/* Pay Button */}
              <Button
                className="w-full bg-gradient-to-r from-cyan-500 to-teal-600 hover:shadow-lg hover:shadow-cyan-500/30 text-white rounded-2xl h-14 text-lg font-semibold transition-all"
                onClick={handlePayment}
              >
                Pay ${price} →
              </Button>

              {/* Security Info */}
              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                  <Lock className="w-4 h-4" />
                  <span>Secured by Stripe · 256-bit SSL encryption</span>
                </div>
              </div>
            </div>
          )}

          {/* Waiting for Payment */}
          {currentStep === 2 && isWaitingPayment && (
            <div className="bg-white rounded-3xl border-2 border-gray-100 p-12 mb-8 shadow-sm">
              {/* Loading Spinner */}
              <div className="flex justify-center mb-8">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 border-8 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>

              {/* Waiting Message */}
              <h2 className="text-2xl font-semibold text-gray-900 text-center mb-4">
                Waiting for payment...
              </h2>
              <p className="text-gray-600 text-center mb-2">
                Complete your payment in the Stripe checkout tab.
              </p>
              <p className="text-gray-400 text-sm text-center mb-8">
                This page will automatically redirect once payment is confirmed.
              </p>

              {/* Reopen Button */}
              <Button
                variant="outline"
                className="w-full border-2 border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 rounded-2xl h-12 text-base font-medium transition-all"
                onClick={reopenStripeCheckout}
              >
                Reopen Stripe checkout
              </Button>
            </div>
          )}

          {/* Domain Configuration */}
          {currentStep === 3 && (
            <div className="bg-white rounded-3xl border-2 border-gray-100 p-8 mb-8 shadow-sm">
              {/* Success Badge */}
              <div className="flex justify-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-full border border-cyan-200">
                  <div className="w-2 h-2 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-cyan-700">Payment successful</span>
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-gray-900 mb-2 text-center">
                Configure your domain
              </h2>
              <p className="text-gray-600 text-center mb-8">
                Choose how users will access your AI assistant
              </p>

              {/* Domain Options */}
              <div className="space-y-4 mb-8">
                {/* Custom Domain */}
                <div className="border-2 border-gray-200 hover:border-cyan-300 rounded-2xl p-5 transition-all group">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Globe className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        Custom Domain
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Use your own domain for a professional branded experience
                      </p>
                      <input
                        type="text"
                        placeholder="e.g., assistant.yourcompany.com"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-cyan-400 focus:outline-none transition-colors text-gray-900"
                      />
                      {domain && (
                        <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-700">
                              You'll need to add a CNAME record pointing to <span className="font-mono">cname.openmoose.ai</span>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Subdomain */}
                <div className="border-2 border-gray-200 hover:border-cyan-300 rounded-2xl p-5 transition-all group">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Globe className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        Openmoose Subdomain
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Quick setup with a free subdomain
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="your-company"
                          value={subdomain}
                          onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                          className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-cyan-400 focus:outline-none transition-colors text-gray-900"
                        />
                        <span className="text-gray-600 font-medium">.openmoose.ai</span>
                      </div>
                      {subdomain && (
                        <div className="mt-3 p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                          <p className="text-sm text-cyan-700">
                            Your assistant will be available at: <span className="font-semibold">{subdomain}.openmoose.ai</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-2 border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 rounded-2xl h-12 text-base font-medium transition-all"
                  onClick={handleSkipDomain}
                >
                  Skip for now
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-teal-600 hover:shadow-lg hover:shadow-cyan-500/30 text-white rounded-2xl h-12 text-base font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleDomainContinue}
                  disabled={!domain && !subdomain}
                >
                  Continue →
                </Button>
              </div>

              {/* Help Text */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  You can change this later in your dashboard settings
                </p>
              </div>
            </div>
          )}

          {/* Channel Configuration */}
          {currentStep === 4 && (
            <div className="bg-white rounded-3xl border-2 border-gray-100 p-8 mb-8 shadow-sm">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2 text-center">
                Choose your channels
              </h2>
              <p className="text-gray-600 text-center mb-8">
                Select where your AI assistant will be available
              </p>

              {/* Channel Options */}
              <div className="space-y-3 mb-8">
                {channels.map(channel => {
                  const isSelected = selectedChannels.includes(channel.id);
                  return (
                    <button
                      key={channel.id}
                      onClick={() => toggleChannel(channel.id)}
                      className={`w-full border-2 rounded-2xl p-5 transition-all text-left ${
                        isSelected 
                          ? 'border-cyan-400 bg-cyan-50/50' 
                          : 'border-gray-200 hover:border-cyan-300'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 bg-gradient-to-br ${channel.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
                          <channel.icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {channel.name}
                            </h3>
                            {channel.recommended && (
                              <span className="px-2 py-0.5 bg-gradient-to-r from-cyan-100 to-teal-100 text-cyan-700 text-xs font-medium rounded-full">
                                Recommended
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {channel.description}
                          </p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected 
                            ? 'border-cyan-500 bg-gradient-to-br from-cyan-400 to-teal-500' 
                            : 'border-gray-300'
                        }`}>
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Channels Summary */}
              {selectedChannels.length > 0 && (
                <div className="mb-6 p-4 bg-cyan-50 rounded-xl border border-cyan-200">
                  <p className="text-sm text-cyan-700">
                    <span className="font-semibold">{selectedChannels.length}</span> channel{selectedChannels.length > 1 ? 's' : ''} selected
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-2 border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 rounded-2xl h-12 text-base font-medium transition-all"
                  onClick={() => setCurrentStep(3)}
                >
                  Back
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-teal-600 hover:shadow-lg hover:shadow-cyan-500/30 text-white rounded-2xl h-12 text-base font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleChannelContinue}
                  disabled={selectedChannels.length === 0}
                >
                  Continue →
                </Button>
              </div>

              {/* Help Text */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  You can add more channels later in your dashboard settings
                </p>
              </div>
            </div>
          )}

          {/* Setup Configuration */}
          {currentStep === 5 && (
            <div className="bg-white rounded-3xl border-2 border-gray-100 p-8 mb-8 shadow-sm">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2 text-center">
                Customize your assistant
              </h2>
              <p className="text-gray-600 text-center mb-8">
                Give your AI assistant a personality
              </p>

              {/* Preview Card */}
              <div className="mb-8 p-6 bg-gradient-to-br from-slate-50 to-cyan-50/30 rounded-2xl border border-gray-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 mb-2">{assistantName}</div>
                    <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm">
                      <p className="text-sm text-gray-700">{welcomeMessage}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assistant Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assistant Name
                </label>
                <input
                  type="text"
                  value={assistantName}
                  onChange={(e) => setAssistantName(e.target.value)}
                  placeholder="e.g., Zylos, Alex, Helper"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-cyan-400 focus:outline-none transition-colors text-gray-900"
                />
              </div>

              {/* Welcome Message */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Welcome Message
                </label>
                <textarea
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder="Enter a friendly greeting..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-cyan-400 focus:outline-none transition-colors text-gray-900 resize-none"
                />
                <p className="mt-2 text-xs text-gray-500">
                  This message will be shown when users start a conversation
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-2 border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 rounded-2xl h-12 text-base font-medium transition-all"
                  onClick={() => setCurrentStep(4)}
                >
                  Back
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-teal-600 hover:shadow-lg hover:shadow-cyan-500/30 text-white rounded-2xl h-12 text-base font-semibold transition-all"
                  onClick={handleSetupContinue}
                >
                  Continue →
                </Button>
              </div>

              {/* Help Text */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  You can fine-tune these settings later in your dashboard
                </p>
              </div>
            </div>
          )}

          {/* Completion */}
          {currentStep === 6 && (
            <div className="bg-white rounded-3xl border-2 border-gray-100 p-12 mb-8 shadow-sm">
              {/* Success Icon */}
              <div className="flex justify-center mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
              </div>

              <h2 className="text-3xl font-semibold text-gray-900 mb-3 text-center">
                All set! 🎉
              </h2>
              <p className="text-gray-600 text-center mb-8 text-lg">
                Your AI assistant <span className="font-semibold text-cyan-700">{assistantName}</span> is now live and ready to help
              </p>

              {/* Summary */}
              <div className="space-y-3 mb-8 max-w-md mx-auto">
                {(domain || subdomain) && (
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Globe className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">Domain</div>
                      <div className="text-sm text-gray-600">{domain || `${subdomain}.openmoose.ai`}</div>
                    </div>
                  </div>
                )}

                {selectedChannels.length > 0 && (
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">Channels</div>
                      <div className="text-sm text-gray-600">{selectedChannels.length} channel{selectedChannels.length > 1 ? 's' : ''} enabled</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Plan</div>
                    <div className="text-sm text-gray-600">{plan} - ${price}/month</div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Button
                className="w-full bg-gradient-to-r from-cyan-500 to-teal-600 hover:shadow-lg hover:shadow-cyan-500/30 text-white rounded-2xl h-14 text-lg font-semibold transition-all"
                onClick={handleFinish}
              >
                Go to Dashboard <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              {/* Help Text */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  Access analytics, manage settings, and more in your dashboard
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}