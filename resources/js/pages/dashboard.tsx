import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { 
    ArrowDownIcon, 
    ArrowUpIcon, 
    BanknoteIcon, 
    CreditCardIcon, 
    DollarSignIcon, 
    TrendingUpIcon,
    UsersIcon,
    AlertTriangleIcon,
    CheckCircleIcon,
    ClockIcon,
    PieChartIcon,
    BarChart3Icon,
    CalendarIcon,
    FileTextIcon
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

// Mock data - in a real app, this would come from your backend
const dashboardData = {
    totalLoans: {
        amount: 2450000,
        change: 12.5,
        trend: 'up'
    },
    activeLoans: {
        count: 156,
        change: 8.2,
        trend: 'up'
    },
    totalCustomers: {
        count: 1247,
        change: 15.3,
        trend: 'up'
    },
    collectionRate: {
        percentage: 94.2,
        change: -2.1,
        trend: 'down'
    },
    recentLoans: [
        { id: 'L001', customer: 'John Doe', amount: 15000, status: 'approved', date: '2024-01-15' },
        { id: 'L002', customer: 'Jane Smith', amount: 25000, status: 'pending', date: '2024-01-14' },
        { id: 'L003', customer: 'Mike Johnson', amount: 10000, status: 'approved', date: '2024-01-14' },
        { id: 'L004', customer: 'Sarah Wilson', amount: 30000, status: 'review', date: '2024-01-13' },
        { id: 'L005', customer: 'David Brown', amount: 20000, status: 'approved', date: '2024-01-13' },
    ],
    upcomingPayments: [
        { customer: 'Alice Cooper', amount: 2500, dueDate: '2024-01-20', status: 'due' },
        { customer: 'Bob Martin', amount: 1800, dueDate: '2024-01-22', status: 'upcoming' },
        { customer: 'Carol Davis', amount: 3200, dueDate: '2024-01-25', status: 'upcoming' },
        { customer: 'Daniel Lee', amount: 1500, dueDate: '2024-01-18', status: 'overdue' },
    ]
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
};

const getStatusBadge = (status: string) => {
    const statusConfig = {
        approved: { variant: 'default' as const, icon: CheckCircleIcon, text: 'Approved' },
        pending: { variant: 'secondary' as const, icon: ClockIcon, text: 'Pending' },
        review: { variant: 'outline' as const, icon: FileTextIcon, text: 'Under Review' },
        due: { variant: 'secondary' as const, icon: CalendarIcon, text: 'Due' },
        upcoming: { variant: 'outline' as const, icon: CalendarIcon, text: 'Upcoming' },
        overdue: { variant: 'destructive' as const, icon: AlertTriangleIcon, text: 'Overdue' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;
    
    return (
        <Badge variant={config.variant} className="gap-1">
            <Icon className="h-3 w-3" />
            {config.text}
        </Badge>
    );
};

export default function Dashboard() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard - SYU MICRO FINANCE" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6 overflow-x-auto">
                {/* Welcome Section */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Welcome to SYU MICRO FINANCE</h1>
                    <p className="text-muted-foreground">
                        Here's an overview of your microfinance operations for today.
                    </p>
                </div>

                {/* Key Metrics Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Loans Outstanding</CardTitle>
                            <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(dashboardData.totalLoans.amount)}</div>
                            <div className="flex items-center text-xs text-muted-foreground">
                                {dashboardData.totalLoans.trend === 'up' ? (
                                    <ArrowUpIcon className="mr-1 h-3 w-3 text-green-500" />
                                ) : (
                                    <ArrowDownIcon className="mr-1 h-3 w-3 text-red-500" />
                                )}
                                <span className={dashboardData.totalLoans.trend === 'up' ? 'text-green-500' : 'text-red-500'}>
                                    {dashboardData.totalLoans.change}%
                                </span>
                                <span className="ml-1">from last month</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
                            <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatNumber(dashboardData.activeLoans.count)}</div>
                            <div className="flex items-center text-xs text-muted-foreground">
                                <ArrowUpIcon className="mr-1 h-3 w-3 text-green-500" />
                                <span className="text-green-500">{dashboardData.activeLoans.change}%</span>
                                <span className="ml-1">from last month</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                            <UsersIcon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatNumber(dashboardData.totalCustomers.count)}</div>
                            <div className="flex items-center text-xs text-muted-foreground">
                                <ArrowUpIcon className="mr-1 h-3 w-3 text-green-500" />
                                <span className="text-green-500">{dashboardData.totalCustomers.change}%</span>
                                <span className="ml-1">from last month</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
                            <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{dashboardData.collectionRate.percentage}%</div>
                            <div className="flex items-center text-xs text-muted-foreground">
                                <ArrowDownIcon className="mr-1 h-3 w-3 text-red-500" />
                                <span className="text-red-500">{Math.abs(dashboardData.collectionRate.change)}%</span>
                                <span className="ml-1">from last month</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts and Analytics Section */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3Icon className="h-5 w-5" />
                                Loan Portfolio Overview
                            </CardTitle>
                            <CardDescription>
                                Monthly loan disbursement and collection trends
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
                                <div className="text-center">
                                    <BarChart3Icon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
                                    <p className="text-muted-foreground">Chart visualization would go here</p>
                                    <p className="text-sm text-muted-foreground/75">Integration with charting library needed</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="col-span-3">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <PieChartIcon className="h-5 w-5" />
                                Loan Status Distribution
                            </CardTitle>
                            <CardDescription>
                                Current loan portfolio breakdown
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
                                <div className="text-center">
                                    <PieChartIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
                                    <p className="text-muted-foreground">Pie chart would go here</p>
                                    <p className="text-sm text-muted-foreground/75">Integration with charting library needed</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Activity and Upcoming Payments */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BanknoteIcon className="h-5 w-5" />
                                Recent Loan Applications
                            </CardTitle>
                            <CardDescription>
                                Latest loan applications and their status
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {dashboardData.recentLoans.map((loan) => (
                                    <div key={loan.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex flex-col">
                                            <div className="font-medium">{loan.customer}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {loan.id} • {formatCurrency(loan.amount)}
                                            </div>
                                            <div className="text-xs text-muted-foreground">{loan.date}</div>
                                        </div>
                                        <div>
                                            {getStatusBadge(loan.status)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CalendarIcon className="h-5 w-5" />
                                Upcoming Payments
                            </CardTitle>
                            <CardDescription>
                                Scheduled loan repayments and due dates
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {dashboardData.upcomingPayments.map((payment, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex flex-col">
                                            <div className="font-medium">{payment.customer}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {formatCurrency(payment.amount)}
                                            </div>
                                            <div className="text-xs text-muted-foreground">Due: {payment.dueDate}</div>
                                        </div>
                                        <div>
                                            {getStatusBadge(payment.status)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>


            </div>
        </AppLayout>
    );
}
