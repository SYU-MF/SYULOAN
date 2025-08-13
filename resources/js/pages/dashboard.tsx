import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

export default function Dashboard() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard - SYU MICRO FINANCE" />
            <div className="flex h-full flex-1 flex-col items-center justify-center p-6">
                {/* Welcome Section */}
                <div className="text-center max-w-2xl mx-auto">
                    <h1 className="text-4xl font-bold tracking-tight mb-4 text-primary">
                        Welcome to SYU MICRO FINANCE
                    </h1>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        Here's an overview of your microfinance operations for today.
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
