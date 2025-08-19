import { Head, useForm, usePage } from '@inertiajs/react';
import { LoaderCircle, User, Lock, CheckCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import GlassInputError from '@/components/glass-input-error';
import { GlassInput } from '@/components/ui/glass-input';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassLabel } from '@/components/ui/glass-label';
import AuthLayout from '@/layouts/auth-layout';
import { SharedData } from '@/types';

type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
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


export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
    });
    
    // Access flash messages
    const page = usePage<LoginPageProps>();
    const flashSuccess = page.props.flash?.success;

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'));
    };

    return (
        <AuthLayout 
            title="Welcome Back" 
            description="Sign in to your account"
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
            
            <form className="space-y-6" onSubmit={submit}>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <GlassLabel htmlFor="email" className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Email
                        </GlassLabel>
                        <GlassInput
                            id="email"
                            type="email"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="Enter your email"
                            disabled={processing}
                        />
                        <GlassInputError message={errors.email} />
                    </div>
                    
                    <div className="space-y-2">
                        <GlassLabel htmlFor="password" className="flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            Password
                        </GlassLabel>
                        <GlassInput
                            id="password"
                            type="password"
                            required
                            tabIndex={2}
                            autoComplete="current-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Enter your password"
                            disabled={processing}
                        />
                        <GlassInputError message={errors.password} />
                    </div>
                    
                    <div className="flex items-center">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                className="rounded border-white/20 bg-white/10 text-blue-600 shadow-sm focus:ring-blue-500 focus:ring-offset-0"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                            />
                            <span className="ml-2 text-sm text-white/80">Remember me</span>
                        </label>
                    </div>
                    
                    <GlassButton 
                        type="submit" 
                        className="w-full h-14 text-base font-semibold" 
                        tabIndex={3} 
                        disabled={processing}
                    >
                        {processing ? (
                            <>
                                <LoaderCircle className="h-5 w-5 animate-spin" />
                                Signing in...
                            </>
                        ) : (
                            'Sign In'
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
                        tabIndex={4}
                    >
                        Create your account
                    </a>
                </div>
            </form>

        </AuthLayout>
    );
}
