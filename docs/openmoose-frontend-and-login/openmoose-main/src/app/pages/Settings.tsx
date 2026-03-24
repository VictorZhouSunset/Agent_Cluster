import { useState } from 'react';
import { ChevronLeft, AlertCircle, Info } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';

export function Settings() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState('Cora');
  const [selectedLanguage, setSelectedLanguage] = useState<'english' | 'chinese'>('english');

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
        <div className="mb-8">
          <h1 className="text-5xl font-light text-gray-900 mb-4">
            Settings
          </h1>
        </div>

        {/* Security Warning */}
        <div className="mb-8 bg-orange-50 border-l-4 border-orange-500 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-orange-800">
            Please verify your environment is secure before modifying settings.
          </p>
        </div>

        {/* Account Section */}
        <div className="bg-white rounded-3xl border-2 border-gray-100 p-8 mb-8 hover:border-gray-200 transition-all">
          <h2 className="text-2xl font-light text-gray-900 mb-8">
            Account
          </h2>

          <div className="space-y-8">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <p className="text-gray-900">
                {user?.email || '329bling@gmail.com'}
              </p>
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                />
                <Button className="bg-gradient-to-r from-cyan-500 to-teal-600 hover:shadow-lg hover:shadow-cyan-500/30 text-white rounded-full px-8 h-12 font-medium">
                  Save
                </Button>
              </div>
            </div>

            {/* Signed in via */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Signed in via
              </label>
              <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm">
                <span className="font-medium">Google</span>
                <span className="text-blue-500">or</span>
                <span className="font-medium">Email (via secure login)</span>
              </span>
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Language
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedLanguage('english')}
                  className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                    selectedLanguage === 'english'
                      ? 'bg-slate-700 text-white shadow-md shadow-slate-700/20'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setSelectedLanguage('chinese')}
                  className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                    selectedLanguage === 'chinese'
                      ? 'bg-slate-700 text-white shadow-md shadow-slate-700/20'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  中文
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Your Plan Section */}
        <div className="bg-white rounded-3xl border-2 border-gray-100 p-8 mb-8 hover:border-gray-200 transition-all">
          <h2 className="text-2xl font-light text-gray-900 mb-6">
            Your Plan
          </h2>

          <p className="text-gray-500 mb-6">
            No subscriptions yet
          </p>

          <Button 
            className="bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 rounded-full px-6 h-11 font-medium"
            onClick={() => window.location.href = '/dashboard'}
          >
            Select a Plan
          </Button>
        </div>

        {/* Passwordless Design Info */}
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-2xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Passwordless design:</span> You sign in using Google or email verification code. No password management needed.
          </p>
        </div>
      </div>
    </div>
  );
}