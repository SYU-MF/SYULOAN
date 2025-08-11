import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthGlassLayout({ children, title, description }: PropsWithChildren<AuthLayoutProps>) {
    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background Image */}
            <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: 'url(/img/bg.jpg)',
                    filter: 'blur(3px)',
                    transform: 'scale(1.1)', // Slightly scale up to avoid blur edge artifacts
                }}
            >
                {/* Overlay for better contrast */}
                <div className="absolute inset-0 bg-black/20"></div>
            </div>
            
            {/* Content */}
            <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
                <div className="w-full max-w-md">
                    {/* Glass morphism container */}
                    <div className="glass-container rounded-3xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
                        {/* Logo */}
                        <div className="mb-8 flex justify-center">
                            <Link href={route('home')} className="transition-transform hover:scale-105">
                                <img 
                                    src="/img/logo.jpg" 
                                    alt="SYU Loan Logo" 
                                    className="h-16 w-16 rounded-2xl object-cover shadow-lg ring-2 ring-white/30"
                                />
                            </Link>
                        </div>

                        {/* Title and Description */}
                        <div className="mb-8 text-center">
                            <h1 className="mb-2 text-2xl font-bold text-white drop-shadow-lg">
                                {title}
                            </h1>
                            <p className="text-sm text-white/80 drop-shadow">
                                {description}
                            </p>
                        </div>

                        {/* Form Content */}
                        <div className="space-y-6">
                            {children}
                        </div>
                    </div>

                    {/* Floating elements for visual appeal */}
                    <div className="absolute -top-4 -left-4 h-24 w-24 rounded-full bg-gradient-to-br from-blue-400/30 to-purple-500/30 blur-xl"></div>
                    <div className="absolute -bottom-4 -right-4 h-32 w-32 rounded-full bg-gradient-to-br from-pink-400/30 to-orange-500/30 blur-xl"></div>
                </div>
            </div>
        </div>
    );
}