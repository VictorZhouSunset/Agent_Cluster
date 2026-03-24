import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

export function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    login(email, password);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      {/* Decorative background elements */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-br from-slate-200 to-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-gradient-to-tr from-cyan-200 to-slate-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

      <div className="max-w-md w-full relative">
        {/* Logo */}
        <div className="text-center mb-6">
          <a href="/" className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-600 to-slate-800 rounded-xl flex items-center justify-center text-white text-base font-bold shadow-sm">
              M
            </div>
            <span className="font-bold text-2xl text-gray-900">
              openmoose
            </span>
          </a>
          <h1 className="text-3xl font-light text-gray-900 mb-2">
            Welcome back
          </h1>
          <p className="text-gray-500 font-light">
            Sign in to your account to continue
          </p>
        </div>

        {/* Sign In Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-900">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl border-gray-200 focus:border-slate-400 focus:ring-slate-400"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-900">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl border-gray-200 focus:border-slate-400 focus:ring-slate-400"
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-slate-700 focus:ring-slate-400"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                  Remember me for 30 days
                </label>
              </div>
              <a href="#" className="text-sm text-slate-600 hover:text-slate-800 transition-colors">
                Forgot password?
              </a>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-cyan-500 to-teal-600 hover:shadow-lg hover:shadow-cyan-500/30 text-white rounded-full font-medium group"
            >
              Sign in
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Social Sign In */}
            <div className="space-y-3">
              {/* First Row: Google & Microsoft */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl border-gray-200 hover:bg-gray-50"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                  </svg>
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl border-gray-200 hover:bg-gray-50"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.4 24H0V8h3.6v12.4H11.4V24zM24 24H12.6V8H24c2.2 0 4 1.8 4 4v8c0 2.2-1.8 4-4 4zM16.2 20.4H24c.2 0 .4-.2.4-.4v-8c0-.2-.2-.4-.4-.4h-7.8V20.4zM11.4 7.2H0v-3.6C0 1.6 1.6 0 3.6 0h7.8V7.2zM3.6 3.6H7.8V3.6H3.6V3.6zM24 7.2H12.6V0H24c2.2 0 4 1.8 4 3.6V7.2c0 0 0 0 0 0zM16.2 3.6H24c.2 0 .4.2.4.4V7.2h-8.2V3.6z"/>
                  </svg>
                  Microsoft
                </Button>
              </div>
              
              {/* Second Row: Apple & More Options */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl border-gray-200 hover:bg-gray-50"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Apple
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowMoreOptions(!showMoreOptions)}
                  className="h-11 rounded-xl border-gray-200 hover:bg-gray-50 text-sm text-gray-600"
                >
                  <span>More options</span>
                  <ChevronDown className={`ml-2 w-4 h-4 transition-transform ${showMoreOptions ? 'rotate-180' : ''}`} />
                </Button>
              </div>
              
              {/* Expandable More Options */}
              {showMoreOptions && (
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-xl border-gray-200 hover:bg-gray-50"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-xl border-gray-200 hover:bg-gray-50"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-xl border-gray-200 hover:bg-gray-50"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </Button>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Sign Up Link */}
        <p className="mt-8 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <a href="/signup" className="font-medium text-slate-700 hover:text-slate-900 transition-colors">
            Sign up for free
          </a>
        </p>

        {/* Terms */}
        <p className="mt-8 text-center text-xs text-gray-500">
          By signing in, you agree to our{' '}
          <a href="#" className="hover:text-slate-700 transition-colors">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="hover:text-slate-700 transition-colors">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}