import { Head, useForm, usePage } from '@inertiajs/react';
import { LoaderCircle, Smartphone, Shield, ArrowLeft, CheckCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import GlassInputError from '@/components/glass-input-error';
import { GlassInput } from '@/components/ui/glass-input';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassLabel } from '@/components/ui/glass-label';
import AuthLayout from '@/layouts/auth-layout';
import { SharedData } from '@/types';
// Utility to get CSRF token from meta tag
function getCsrfToken() {
    return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
}

type LoginForm = {
    mobile_number: string;
};

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

interface LoginPageProps extends SharedData {
    flash?: {
        success?: string;
        error?: string;
    };
}


import { useState } from 'react';
import { router } from '@inertiajs/react';

export default function Login({ status, canResetPassword }: LoginProps) {
    const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
    const [otp, setOtp] = useState('');
    const [otpInfo, setOtpInfo] = useState<{ otp: string; expires_at: string } | null>(null);
    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        mobile_number: '',
    });
    
    // Access flash messages
    const page = usePage<LoginPageProps>();
    const flashSuccess = page.props.flash?.success;

    const handleMobileSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        setOtp('');
        setOtpInfo(null);
        post(route('login.request-otp'), {
            preserveScroll: true,
            onSuccess: (response: any) => {
                const res = response?.data || response;
                setOtpInfo({ otp: res.otp, expires_at: res.expires_at });
                setStep('otp');
            },
        });
    };

    const [otpError, setOtpError] = useState<string | null>(null);
    const handleOtpSubmit: FormEventHandler = async (e) => {
        e.preventDefault();
        setOtpError(null);
        try {
            const response = await fetch(route('login.verify-otp'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                credentials: 'include',
                body: JSON.stringify({
                    mobile_number: data.mobile_number,
                    otp,
                }),
            });
            const res = await response.json();
            if (res.success && res.redirect) {
                window.location.href = res.redirect;
            } else {
                setOtpError(res.message || 'Invalid or expired OTP.');
            }
        } catch (err) {
            setOtpError('An error occurred. Please try again.');
        }
    };

    const handleLogout = () => {
        // Use Inertia or fetch to POST to your logout route, then reload
        fetch(route('logout'), {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                'X-Requested-With': 'XMLHttpRequest',
            },
            credentials: 'same-origin',
        }).then(() => {
            // Force a full reload to get a fresh CSRF token
            window.location.replace(route('login'));
        });
    };

    return (
        <AuthLayout 
            title={step === 'mobile' ? "Welcome Back" : "Verify Your Identity"} 
            description={step === 'mobile' ? "Enter your mobile number to receive a secure OTP" : "Enter the 6-digit code sent to your phone"}
        >
            <Head title="Log in" />
            
            {/* Display success message from registration */}
            {flashSuccess && (
                <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 backdrop-blur-sm">
                    <div className="flex items-center gap-3 text-green-400">
                        <CheckCircle className="h-5 w-5 flex-shrink-0" />
                        <p className="text-sm font-medium">{flashSuccess}</p>
                    </div>
                </div>
            )}
            
            {step === 'mobile' && (
                <form className="space-y-6" onSubmit={handleMobileSubmit}>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <GlassLabel htmlFor="mobile_number" className="flex items-center gap-2">
                                <Smartphone className="h-4 w-4" />
                                Mobile Number
                            </GlassLabel>
                            <GlassInput
                                id="mobile_number"
                                type="tel"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="tel"
                                value={data.mobile_number}
                                onChange={(e) => setData('mobile_number', e.target.value)}
                                placeholder="09171234567"
                                maxLength={11}
                                disabled={processing}
                                className="text-center text-lg tracking-wider"
                            />
                            <GlassInputError message={errors.mobile_number} />
                        </div>
                        
                        <GlassButton 
                            type="submit" 
                            className="w-full h-14 text-base font-semibold" 
                            tabIndex={2} 
                            disabled={processing}
                        >
                            {processing ? (
                                <>
                                    <LoaderCircle className="h-5 w-5 animate-spin" />
                                    Sending OTP...
                                </>
                            ) : (
                                <>
                                    <Shield className="h-5 w-5" />
                                    Send Secure OTP
                                </>
                            )}
                        </GlassButton>
                    </div>
                    
                    <div className="text-center">
                        <p className="text-sm text-white/80 mb-2">
                            Don't have an account?
                        </p>
                        <a 
                            href={route('register')} 
                            className="glass-link text-sm font-medium"
                            tabIndex={3}
                        >
                            Create your account
                        </a>
                    </div>
                </form>
            )}
            
            {step === 'otp' && (
                <>
                    {otpInfo && (
                        <div className="otp-display mb-6">
                            <div className="mb-2">
                                <Shield className="h-6 w-6 mx-auto mb-2" />
                                <div className="text-sm opacity-90">Development OTP</div>
                            </div>
                            <div className="otp-code">{otpInfo.otp}</div>
                            <div className="text-xs mt-2 opacity-75">
                                Expires: {new Date(otpInfo.expires_at).toLocaleTimeString()}
                            </div>
                        </div>
                    )}
                    
                    <form className="space-y-6" onSubmit={handleOtpSubmit}>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <GlassLabel htmlFor="otp" className="flex items-center gap-2 justify-center">
                                    <Shield className="h-4 w-4" />
                                    Verification Code
                                </GlassLabel>
                                <GlassInput
                                    id="otp"
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]{6}"
                                    maxLength={6}
                                    minLength={6}
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    placeholder="000000"
                                    disabled={processing}
                                    className="text-center text-2xl tracking-[0.5em] font-mono"
                                />
                                <GlassInputError message={otpError || undefined} />
                            </div>
                            
                            <GlassButton 
                                type="submit" 
                                className="w-full h-14 text-base font-semibold" 
                                tabIndex={2} 
                                disabled={processing || otp.length !== 6}
                            >
                                {processing ? (
                                    <>
                                        <LoaderCircle className="h-5 w-5 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        <Shield className="h-5 w-5" />
                                        Verify & Login
                                    </>
                                )}
                            </GlassButton>
                        </div>
                        
                        <div className="text-center">
                            <button 
                                type="button" 
                                className="glass-link text-sm font-medium flex items-center gap-2 mx-auto"
                                onClick={() => setStep('mobile')}
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Change mobile number
                            </button>
                        </div>
                    </form>
                </>
            )}
        </AuthLayout>
    );
}
