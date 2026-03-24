import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { ArrowRight, ChevronDown, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

interface ValidationState {
  email: {
    touched: boolean;
    error: string | null;
  };
  password: {
    touched: boolean;
    error: string | null;
  };
}

function validateEmail(email: string): string | null {
  if (!email) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Please enter a valid email address';
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  return null;
}

export function SignUp() {
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validation, setValidation] = useState<ValidationState>({
    email: { touched: false, error: null },
    password: { touched: false, error: null },
  });
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  const emailError = useMemo(() => validateEmail(email), [email]);
  const passwordError = useMemo(() => validatePassword(password), [password]);

  const isEmailValid = !emailError;
  const isPasswordValid = !passwordError;
  const isFormValid = isEmailValid && isPasswordValid && agreedToTerms;

  const handleEmailBlur = () => {
    setValidation(prev => ({
      ...prev,
      email: { touched: true, error: emailError }
    }));
  };

  const handlePasswordBlur = () => {
    setValidation(prev => ({
      ...prev,
      password: { touched: true, error: passwordError }
    }));
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (validation.email.touched) {
      const error = validateEmail(value);
      setValidation(prev => ({
        ...prev,
        email: { touched: true, error }
      }));
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (validation.password.touched) {
      const error = validatePassword(value);
      setValidation(prev => ({
        ...prev,
        password: { touched: true, error }
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    setValidation({
      email: { touched: true, error: emailError },
      password: { touched: true, error: passwordError },
    });

    if (!isFormValid) {
      if (!agreedToTerms) {
        setError('Please agree to the Terms of Service and Privacy Policy');
      } else if (emailError) {
        setError(emailError);
      } else if (passwordError) {
        setError(passwordError);
      }
      return;
    }

    setIsLoading(true);

    try {
      const { error, data } = await signup(email, password);
      
      if (error) {
        setError(error.message);
      } else {
        navigate('/verify-email', { state: { email, password } });
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getInputClassName = (fieldName: 'email' | 'password', hasError: boolean, isValid: boolean) => {
    const baseClass = 'h-12 rounded-xl focus:ring-slate-400 pr-10';
    if (!validation[fieldName].touched) {
      return `${baseClass} border-gray-200 focus:border-slate-400`;
    }
    if (hasError) {
      return `${baseClass} border-red-300 focus:border-red-400 focus:ring-red-400`;
    }
    if (isValid) {
      return `${baseClass} border-green-300 focus:border-green-400 focus:ring-green-400`;
    }
    return `${baseClass} border-gray-200 focus:border-slate-400`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-br from-slate-200 to-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-gradient-to-tr from-cyan-200 to-slate-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

      <div className="max-w-md w-full relative">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-600 to-slate-800 rounded-xl flex items-center justify-center text-white text-base font-bold shadow-sm">
              M
            </div>
            <span className="font-bold text-2xl text-gray-900">
              openmoose
            </span>
          </Link>
          <h1 className="text-3xl font-light text-gray-900 mb-2">
            Create your account
          </h1>
          <p className="text-gray-500 font-light">
            Start building AI agent teams today
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-900">
                Full name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 rounded-xl border-gray-200 focus:border-slate-400 focus:ring-slate-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-900">
                Email address
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  onBlur={handleEmailBlur}
                  className={getInputClassName('email', !!emailError, isEmailValid)}
                />
                {validation.email.touched && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isEmailValid ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {validation.email.touched && emailError && (
                <p className="text-sm text-red-500 mt-1">{emailError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-900">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  onBlur={handlePasswordBlur}
                  className={getInputClassName('password', !!passwordError, isPasswordValid)}
                />
                {validation.password.touched && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isPasswordValid ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {validation.password.touched && passwordError && (
                <p className="text-sm text-red-500 mt-1">{passwordError}</p>
              )}
              {password && !isPasswordValid && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs space-y-1">
                  <p className="text-gray-600 font-medium mb-2">Password requirements:</p>
                  <div className={`flex items-center gap-2 ${password.length >= 6 ? 'text-green-600' : 'text-gray-400'}`}>
                    <span>{password.length >= 6 ? '✓' : '○'}</span>
                    <span>At least 6 characters</span>
                  </div>
                  <div className={`flex items-center gap-2 ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
                    <span>{/[A-Z]/.test(password) ? '✓' : '○'}</span>
                    <span>One uppercase letter</span>
                  </div>
                  <div className={`flex items-center gap-2 ${/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
                    <span>{/[a-z]/.test(password) ? '✓' : '○'}</span>
                    <span>One lowercase letter</span>
                  </div>
                  <div className={`flex items-center gap-2 ${/[0-9]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
                    <span>{/[0-9]/.test(password) ? '✓' : '○'}</span>
                    <span>One number</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-slate-700 focus:ring-slate-400 mt-1"
              />
              <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                I agree to the{' '}
                <a href="#" className="text-slate-700 hover:text-slate-900 transition-colors">
                  Terms of Service
                </a>
                {' '}and{' '}
                <a href="#" className="text-slate-700 hover:text-slate-900 transition-colors">
                  Privacy Policy
                </a>
              </label>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-cyan-500 to-teal-600 hover:shadow-lg hover:shadow-cyan-500/30 text-white rounded-full font-medium group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or sign up with</span>
              </div>
            </div>

            <div className="space-y-3">
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

        <p className="mt-8 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/signin" className="font-medium text-slate-700 hover:text-slate-900 transition-colors">
            Sign in
          </Link>
        </p>

        <p className="mt-8 text-center text-xs text-gray-500">
          Protected by reCAPTCHA and subject to the{' '}
          <a href="#" className="hover:text-slate-700 transition-colors">Google Privacy Policy</a>
          {' '}and{' '}
          <a href="#" className="hover:text-slate-700 transition-colors">Terms of Service</a>
        </p>
      </div>
    </div>
  );
}
