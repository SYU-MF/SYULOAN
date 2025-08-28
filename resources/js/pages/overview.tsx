import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    AreaChart, 
    Area, 
    BarChart, 
    Bar, 
    LineChart, 
    Line, 
    PieChart, 
    Pie, 
    Cell, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer 
} from 'recharts';
import { 
    TrendingUp, 
    TrendingDown, 
    Users, 
    CreditCard, 
    DollarSign, 
    AlertTriangle,
    CheckCircle,
    Clock,
    Target
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Overview',
        href: '/dashboard',
    },
];

interface DashboardData {
    keyMetrics: {
        totalRevenue: number;
        totalLoans: number;
        activeLoans: number;
        totalBorrowers: number;
    };
    monthlyData: Array<{
        month: string;
        loans: number;
        payments: number;
        revenue: number;
    }>;
    loanStatusData: Array<{
        name: string;
        value: number;
        color: string;
    }>;
    paymentTrendData: Array<{
        week: string;
        onTime: number;
        late: number;
        missed: number;
    }>;
    borrowerSegmentData: Array<{
        segment: string;
        count: number;
        percentage: number;
    }>;
    quickStats: {
        pendingApprovals: number;
        overduePayments: number;
        overdueAmount: number;
        completedToday: number;
    };
}

interface OverviewProps {
    dashboardData: DashboardData;
}

export default function Overview({ dashboardData }: OverviewProps) {
    const {
        keyMetrics,
        monthlyData,
        loanStatusData,
        paymentTrendData,
        borrowerSegmentData,
        quickStats
    } = dashboardData;
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Overview - SYU MICRO FINANCE" />
            <div className="flex-1 space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Overview Dashboard</h1>
                        <p className="text-muted-foreground">
                            Monitor your microfinance operations and key performance metrics
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-muted-foreground">Last updated</p>
                        <p className="text-sm font-medium">{new Date().toLocaleString()}</p>
                    </div>
                </div>

                {/* Key Metrics Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-l-4 border-l-green-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">₱{keyMetrics.totalRevenue.toLocaleString()}</div>
                            <div className="flex items-center text-xs text-green-600">
                                <TrendingUp className="mr-1 h-3 w-3" />
                                Year to date revenue
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-blue-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
                            <CreditCard className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{keyMetrics.totalLoans}</div>
                            <div className="flex items-center text-xs text-blue-600">
                                <TrendingUp className="mr-1 h-3 w-3" />
                                Total loans in system
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-purple-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Borrowers</CardTitle>
                            <Users className="h-4 w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-600">{keyMetrics.totalBorrowers}</div>
                            <div className="flex items-center text-xs text-purple-600">
                                <TrendingUp className="mr-1 h-3 w-3" />
                                Confirmed borrowers
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-orange-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
                            <Target className="h-4 w-4 text-orange-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">94.2%</div>
                            <div className="flex items-center text-xs text-red-600">
                                <TrendingDown className="mr-1 h-3 w-3" />
                                -2.1% from last month
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Section */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Revenue Trend */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Revenue Trend</CardTitle>
                            <CardDescription>Monthly revenue and loan disbursement trends</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                    <XAxis dataKey="month" className="text-xs" />
                                    <YAxis className="text-xs" />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: 'hsl(var(--background))', 
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '6px'
                                        }} 
                                    />
                                    <Legend />
                                    <Area 
                                        type="monotone" 
                                        dataKey="revenue" 
                                        stackId="1" 
                                        stroke="#10b981" 
                                        fill="#10b981" 
                                        fillOpacity={0.6}
                                        name="Revenue (₱)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Loan Status Distribution */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Loan Status Distribution</CardTitle>
                            <CardDescription>Current status of all loans in the system</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={loanStatusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, value }) => `${name}: ${value}`}
                                    >
                                        {loanStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Additional Charts */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Payment Performance */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment Performance</CardTitle>
                            <CardDescription>Weekly payment collection analysis</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={paymentTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                    <XAxis dataKey="week" className="text-xs" />
                                    <YAxis className="text-xs" />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: 'hsl(var(--background))', 
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '6px'
                                        }} 
                                    />
                                    <Legend />
                                    <Bar dataKey="onTime" stackId="a" fill="#10b981" name="On Time" />
                                    <Bar dataKey="late" stackId="a" fill="#f59e0b" name="Late" />
                                    <Bar dataKey="missed" stackId="a" fill="#ef4444" name="Missed" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Borrower Segments */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Borrower Segments</CardTitle>
                            <CardDescription>Distribution of borrowers by category</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={borrowerSegmentData}>
                                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                    <XAxis dataKey="segment" className="text-xs" />
                                    <YAxis className="text-xs" />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: 'hsl(var(--background))', 
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '6px'
                                        }} 
                                    />
                                    <Legend />
                                    <Line 
                                        type="monotone" 
                                        dataKey="count" 
                                        stroke="#6366f1" 
                                        strokeWidth={3}
                                        dot={{ fill: '#6366f1', strokeWidth: 2, r: 6 }}
                                        name="Borrower Count"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                            <Clock className="h-4 w-4 text-yellow-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{quickStats.pendingApprovals}</div>
                            <p className="text-xs text-muted-foreground">Requires immediate attention</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Overdue Payments</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{quickStats.overduePayments}</div>
                            <p className="text-xs text-muted-foreground">Total amount: ₱{quickStats.overdueAmount.toLocaleString()}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{quickStats.completedToday}</div>
                            <p className="text-xs text-muted-foreground">Payments processed successfully</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
