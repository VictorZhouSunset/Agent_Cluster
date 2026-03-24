import { ChevronLeft, CreditCard, Check } from 'lucide-react';
import { Button } from '../components/ui/button';

export function Billing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/30 pt-32 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Back button */}
        <a 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-16 transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Billing
        </a>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-light text-gray-900 mb-4">
            Manage Billing
          </h1>
          <p className="text-lg text-gray-500 font-light">
            Our AI tools subscription pricing is simple - you can cancel anytime.
          </p>
        </div>

        {/* Current Plan Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-light text-gray-900 mb-6">
            Current Plan
          </h2>
          
          <div className="bg-white rounded-3xl border-2 border-gray-100 p-8 hover:border-gray-200 transition-all hover:shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              {/* Left side - Plan info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-600 to-teal-700 rounded-xl flex items-center justify-center">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-900">
                      Professional
                    </h3>
                    <p className="text-sm text-gray-500">
                      Active subscription
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-light text-gray-900">$100</span>
                    <span className="text-gray-500">/Month</span>
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    Next billing date: <span className="font-medium text-gray-900">10 June 2024</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <Button className="bg-gradient-to-r from-cyan-500 to-teal-600 hover:shadow-lg hover:shadow-cyan-500/30 text-white rounded-full px-6 h-11 font-medium">
                    Update Plan
                  </Button>
                  <button className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors">
                    Cancel Plan
                  </button>
                </div>
              </div>

              {/* Right side - Illustration placeholder */}
              <div className="lg:w-48 lg:h-48 w-32 h-32 mx-auto lg:mx-0 bg-gradient-to-br from-cyan-500/10 to-teal-600/10 rounded-3xl flex items-center justify-center">
                <div className="w-24 h-24 lg:w-32 lg:h-32 bg-gradient-to-br from-cyan-600 to-teal-700 rounded-2xl flex items-center justify-center">
                  <CreditCard className="w-12 h-12 lg:w-16 lg:h-16 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Section */}
        <div>
          <h2 className="text-2xl font-light text-gray-900 mb-6">
            Payment
          </h2>

          <div className="space-y-4">
            {/* Existing payment method */}
            <div className="bg-white rounded-3xl border-2 border-gray-100 p-6 hover:border-gray-200 transition-all hover:shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">VISA</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      •••• •••• •••• 1234
                    </p>
                    <p className="text-xs text-gray-500">
                      Expires 12/25
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-cyan-600 font-medium bg-cyan-50 px-3 py-1.5 rounded-full">
                    Default
                  </span>
                  <button className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
                    Edit
                  </button>
                </div>
              </div>
            </div>

            {/* Add new payment method button */}
            <button className="w-full bg-white rounded-3xl border-2 border-dashed border-gray-200 p-6 hover:border-cyan-500 hover:bg-cyan-50/30 transition-all group">
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-cyan-100 flex items-center justify-center transition-colors">
                  <span className="text-2xl text-gray-400 group-hover:text-cyan-600 transition-colors">+</span>
                </div>
                <span className="text-gray-600 group-hover:text-cyan-700 font-medium transition-colors">
                  Add new payment method
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-12 p-6 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-sm text-gray-600 leading-relaxed">
            <span className="font-medium text-gray-900">Note:</span> Your subscription will automatically renew on the next billing date. 
            You can cancel or change your plan at any time. Refunds are available within 14 days of purchase.
          </p>
        </div>
      </div>
    </div>
  );
}