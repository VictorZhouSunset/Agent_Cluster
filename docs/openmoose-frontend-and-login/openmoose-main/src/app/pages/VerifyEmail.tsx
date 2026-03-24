import {Button} from '../components/ui/button';
import {Link, useLocation} from 'react-router';
import {Mail, RefreshCw, ArrowLeft} from 'lucide-react';
import {useState, useEffect, useRef} from 'react';
import {supabase} from '@/lib/supabase';

export function VerifyEmail() {
    const location = useLocation();
    const email = location.state?.email || '';
    const password = location.state?.password || '';
    const [isResending, setIsResending] = useState(false);
    const [resendMessage, setResendMessage] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(60);
    const [isChecking, setIsChecking] = useState(false);
    const hasRedirected = useRef(false);

    useEffect(() => {
        if (hasRedirected.current || !email || !password) return;

        const checkVerification = async () => {
            if (hasRedirected.current) return;
            setIsChecking(true);

            try {
                const {data, error} = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                console.log("Verification check result:", {data: !!data.session, error});

                if (!error && data.session && !hasRedirected.current) {
                    hasRedirected.current = true;
                    console.log("Email verified and logged in, redirecting to home");
                    window.location.href = '/';
                }
            } catch (err) {
                console.error("Error checking verification:", err);
            } finally {
                setIsChecking(false);
            }
        };

        checkVerification();

        const interval = setInterval(checkVerification, 3000);

        const countdownInterval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    return 60;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            clearInterval(interval);
            clearInterval(countdownInterval);
        };
    }, [email, password]);

    const handleResendEmail = async () => {
        if (!email) return;

        setIsResending(true);
        setResendMessage(null);

        try {
            const {error} = await supabase.auth.resend({
                type: 'signup',
                email: email,
            });

            if (error) {
                setResendMessage(`Error: ${error.message}`);
            } else {
                setResendMessage('Verification email sent! Please check your inbox.');
            }
        } catch (err) {
            setResendMessage('Failed to resend email. Please try again.');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
            <div
                className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-br from-slate-200 to-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
            <div
                className="absolute bottom-20 left-10 w-96 h-96 bg-gradient-to-tr from-cyan-200 to-slate-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

            <div className="max-w-md w-full relative">
                <div className="text-center mb-6">
                    <Link to="/" className="inline-flex items-center gap-3 mb-4">
                        <div
                            className="w-10 h-10 bg-gradient-to-br from-cyan-600 to-slate-800 rounded-xl flex items-center justify-center text-white text-base font-bold shadow-sm">
                            M
                        </div>
                        <span className="font-bold text-2xl text-gray-900">
              openmoose
            </span>
                    </Link>
                </div>

                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center">
                    <div
                        className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Mail className="w-8 h-8 text-white"/>
                    </div>

                    <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                        Check your email
                    </h1>

                    <p className="text-gray-500 mb-4">
                        We've sent a verification link to
                    </p>

                    <p className="text-gray-900 font-medium mb-6 bg-gray-50 py-2 px-4 rounded-lg inline-block">
                        {email || 'your email address'}
                    </p>

                    <p className="text-sm text-gray-500 mb-6">
                        Click the link in the email to verify your account. Once verified, this page will automatically
                        redirect.
                    </p>

                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className={`w-2 h-2 rounded-full ${isChecking ? 'bg-cyan-500 animate-pulse' : 'bg-gray-300'}`}></div>
                        <p className="text-sm text-cyan-600">
                            Waiting for verification... ({countdown}s)
                        </p>
                    </div>

                    {resendMessage && (
                        <div className={`p-3 text-sm rounded-xl border mb-4 ${
                            resendMessage.includes('Error')
                                ? 'text-red-600 bg-red-50 border-red-100'
                                : 'text-green-600 bg-green-50 border-green-100'
                        }`}>
                            {resendMessage}
                        </div>
                    )}

                    <div className="space-y-3">
                        <Button
                            onClick={handleResendEmail}
                            disabled={isResending || !email}
                            variant="outline"
                            className="w-full h-12 rounded-xl border-gray-200 hover:bg-gray-50"
                        >
                            {isResending ? (
                                <>
                                    <RefreshCw className="mr-2 w-4 h-4 animate-spin"/>
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="mr-2 w-4 h-4"/>
                                    Resend verification email
                                </>
                            )}
                        </Button>

                        <Link to="/signin">
                            <Button
                                variant="ghost"
                                className="w-full h-12 rounded-xl text-gray-600 hover:text-gray-900"
                            >
                                <ArrowLeft className="mr-2 w-4 h-4"/>
                                Back to sign in
                            </Button>
                        </Link>
                    </div>
                </div>

                <p className="mt-8 text-center text-xs text-gray-500">
                    Didn't receive the email? Check your spam folder or{' '}
                    <button
                        onClick={handleResendEmail}
                        className="text-slate-700 hover:text-slate-900 transition-colors"
                    >
                        click here to resend
                    </button>
                </p>
            </div>
        </div>
    );
}
