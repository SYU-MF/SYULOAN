import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import GlassInputError from '@/components/glass-input-error';
import TextLink from '@/components/text-link';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassInput } from '@/components/ui/glass-input';
import { GlassLabel } from '@/components/ui/glass-label';
import AuthLayout from '@/layouts/auth-layout';

type RegisterForm = {
    name: string;
    email: string;
    mobile_number: string;
    password: string;
    password_confirmation: string;
};

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm<Required<RegisterForm>>({
        name: '',
        email: '',
        mobile_number: '',
        password: '',
        password_confirmation: '',
    });

    // Custom validation state
    const [customErrors, setCustomErrors] = React.useState<{ name?: string; email?: string; mobile_number?: string }>({});

    const validate = () => {
        const errors: { name?: string; email?: string; mobile_number?: string } = {};
        // Name: max 50, only letters and spaces
        if (!/^([A-Za-z\s]{1,50})$/.test(data.name)) {
            if (data.name.length > 50) {
                errors.name = 'Name must not exceed 50 characters.';
            } else {
                errors.name = 'Name must only contain letters and spaces.';
            }
        }
        // Email: valid, max 50
        if (!/^.{1,50}$/.test(data.email)) {
            errors.email = 'Email must not exceed 50 characters.';
        } else if (!/^\S+@\S+\.\S+$/.test(data.email)) {
            errors.email = 'Email must be a valid email address.';
        }
        // Mobile: exactly 11 digits, only numbers
        if (!/^\d{11}$/.test(data.mobile_number)) {
            errors.mobile_number = 'Mobile number must be exactly 11 digits.';
        }
        setCustomErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!validate()) return;
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout title="Create an account" description="Enter your details below to create your account">
            <Head title="Register" />
            <form className="space-y-6" onSubmit={submit}>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <GlassLabel htmlFor="name">Name</GlassLabel>
                        <GlassInput
                            id="name"
                            type="text"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            disabled={processing}
                            placeholder="Full name"
                            maxLength={50}
                        />
                        <GlassInputError message={customErrors.name || errors.name} />
                    </div>


                    <div className="space-y-2">
                        <GlassLabel htmlFor="email">Email address</GlassLabel>
                        <GlassInput
                            id="email"
                            type="email"
                            required
                            tabIndex={2}
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            disabled={processing}
                            placeholder="email@example.com"
                            maxLength={50}
                        />
                        <GlassInputError message={customErrors.email || errors.email} />
                    </div>

                    <div className="space-y-2">
                        <GlassLabel htmlFor="mobile_number">Mobile Number</GlassLabel>
                        <GlassInput
                            id="mobile_number"
                            type="tel"
                            required
                            tabIndex={3}
                            autoComplete="tel"
                            value={data.mobile_number}
                            onChange={(e) => {
                                // Only allow digits
                                const value = e.target.value.replace(/\D/g, '');
                                setData('mobile_number', value);
                            }}
                            disabled={processing}
                            placeholder="e.g. 09171234567"
                            maxLength={11}
                        />
                        <GlassInputError message={customErrors.mobile_number || errors.mobile_number} />
                    </div>

                    <div className="space-y-2">
                        <GlassLabel htmlFor="password">Password</GlassLabel>
                        <GlassInput
                            id="password"
                            type="password"
                            required
                            tabIndex={4}
                            autoComplete="new-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            disabled={processing}
                            placeholder="Password"
                        />
                        <GlassInputError message={errors.password} />
                    </div>

                    <div className="space-y-2">
                        <GlassLabel htmlFor="password_confirmation">Confirm password</GlassLabel>
                        <GlassInput
                            id="password_confirmation"
                            type="password"
                            required
                            tabIndex={5}
                            autoComplete="new-password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            disabled={processing}
                            placeholder="Confirm password"
                        />
                        <GlassInputError message={errors.password_confirmation} />
                    </div>

                    <GlassButton type="submit" className="w-full" tabIndex={6} disabled={processing}>
                        {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                        Create account
                    </GlassButton>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <TextLink href={route('login')} tabIndex={6}>
                        Log in
                    </TextLink>
                </div>
            </form>
        </AuthLayout>
    );
}
