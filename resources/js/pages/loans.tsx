import React, { useState, useMemo } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

export const Textarea = ({ className, ...props }: TextareaProps) => {
  return (
    <textarea
      className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
};
import InputError from '@/components/input-error';
import { 
    Search, 
    Filter, 
    Plus, 
    CreditCard, 
    DollarSign, 
    Calendar, 
    User, 
    TrendingUp,
    Clock,
    CheckCircle,
    AlertTriangle,
    Eye,
    Edit,
    Trash2,
    Grid3X3,
    List
} from 'lucide-react';

interface Borrower {
    id: number;
    borrower_id: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    email: string;
    phone: string;
    status: number;
}

interface Loan {
    id: number;
    loan_id: string;
    borrower_id: number;
    borrower: Borrower;
    principal_amount: number;
    loan_duration: number;
    duration_period: string;
    loan_release_date: string;
    interest_rate: number;
    interest_method?: string;
    total_amount: number;
    monthly_payment: number;
    loan_type: string;
    purpose?: string;
    collateral?: string;
    status: number;
    due_date: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

interface LoansPageProps {
    loans: Loan[];
    eligibleBorrowers: Borrower[];
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

const getStatusBadge = (status: number) => {
    switch (status) {
        case 1:
            return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
        case 2:
            return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">Approved</Badge>;
        case 3:
            return <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
        case 4:
            return <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200">Completed</Badge>;
        case 5:
            return <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">Defaulted</Badge>;
        default:
            return <Badge variant="secondary">Unknown</Badge>;
    }
};

export default function Loans({ loans, eligibleBorrowers }: LoansPageProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        borrower_id: '',
        principal_amount: '',
        loan_duration: '',
        duration_period: 'months',
        loan_release_date: '',
        interest_rate: '',
        interest_method: 'simple',
        loan_type: 'personal',
        purpose: '',
        collateral: '',
        notes: ''
    });

    // Format number with commas
    const formatNumberWithCommas = (value: string) => {
        // Remove all non-digit characters
        const numericValue = value.replace(/[^\d]/g, '');
        // Add commas
        return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    // Handle principal amount change with comma formatting
    const handlePrincipalAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        // Remove commas for the actual value
        const numericValue = inputValue.replace(/,/g, '');
        // Update form data with numeric value (no commas)
        setData('principal_amount', numericValue);
    };

    const filteredLoans = useMemo(() => {
        return loans.filter(loan => {
            const matchesSearch = 
                loan.loan_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                loan.borrower.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                loan.borrower.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                loan.borrower.borrower_id.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = statusFilter === 'all' || 
                (statusFilter === 'pending' && loan.status === 1) ||
                (statusFilter === 'approved' && loan.status === 2) ||
                (statusFilter === 'active' && loan.status === 3) ||
                (statusFilter === 'completed' && loan.status === 4) ||
                (statusFilter === 'defaulted' && loan.status === 5);
            
            return matchesSearch && matchesStatus;
        });
    }, [loans, searchTerm, statusFilter]);

    const statistics = useMemo(() => {
        const totalLoans = loans.length;
        const activeLoans = loans.filter(l => l.status === 3).length;
        const totalAmount = loans.reduce((sum, loan) => sum + loan.principal_amount, 0);
        const pendingLoans = loans.filter(l => l.status === 1).length;

        return {
            totalLoans,
            activeLoans,
            totalAmount,
            pendingLoans,
        };
    }, [loans]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('loans.store'), {
            onSuccess: () => {
                reset();
                setIsModalOpen(false);
            }
        });
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        reset();
    };

    return (
        <AppLayout>
            <Head title="Loans Management" />
            
            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Loans Management</h1>
                        <p className="text-gray-600 dark:text-gray-300 mt-1">Manage and track all loan applications and disbursements</p>
                    </div>
                    <Button 
                        onClick={() => setIsModalOpen(true)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                        disabled={eligibleBorrowers.length === 0}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Loan
                    </Button>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-sm font-medium">Total Loans</p>
                                    <p className="text-3xl font-bold">{statistics.totalLoans}</p>
                                </div>
                                <CreditCard className="h-8 w-8 text-blue-200" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-100 text-sm font-medium">Active Loans</p>
                                    <p className="text-3xl font-bold">{statistics.activeLoans}</p>
                                </div>
                                <CheckCircle className="h-8 w-8 text-green-200" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-100 text-sm font-medium">Total Amount</p>
                                    <p className="text-2xl font-bold">{formatCurrency(statistics.totalAmount)}</p>
                                </div>
                                <DollarSign className="h-8 w-8 text-purple-200" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-orange-100 text-sm font-medium">Pending Applications</p>
                                    <p className="text-3xl font-bold">{statistics.pendingLoans}</p>
                                </div>
                                <Clock className="h-8 w-8 text-orange-200" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search and Filter Bar */}
                <Card className="shadow-sm border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                            <div className="flex flex-col sm:flex-row gap-4 flex-1">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input
                                        type="text"
                                        placeholder="Search loans..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                                    />
                                </div>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-full sm:w-48 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                                        <Filter className="h-4 w-4 mr-2" />
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="approved">Approved</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="defaulted">Defaulted</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setViewMode('grid')}
                                    className="px-3"
                                >
                                    <Grid3X3 className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant={viewMode === 'table' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setViewMode('table')}
                                    className="px-3"
                                >
                                    <List className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Loans Display */}
                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredLoans.map((loan) => (
                            <Card key={loan.id} className="hover:shadow-lg transition-shadow duration-200 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {loan.loan_id}
                                        </CardTitle>
                                        {getStatusBadge(loan.status)}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        <div className="flex items-center gap-1">
                                            <User className="h-4 w-4" />
                                            {loan.borrower.first_name} {loan.borrower.last_name}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-500 dark:text-gray-400">Principal Amount</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(loan.principal_amount)}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 dark:text-gray-400">Total Amount</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(loan.total_amount)}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 dark:text-gray-400">Monthly Payment</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(loan.monthly_payment)}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 dark:text-gray-400">Interest Rate</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">{loan.interest_rate}%</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 dark:text-gray-400">Duration</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">{loan.loan_duration} months</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 dark:text-gray-400">Release Date</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {new Date(loan.loan_release_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.get(route('loans.show', loan.id))}
                                            className="flex-1"
                                        >
                                            <Eye className="h-4 w-4 mr-1" />
                                            View
                                        </Button>
                                        {loan.status === 1 && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => router.patch(route('loans.approve', loan.id))}
                                                className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
                                            >
                                                <CheckCircle className="h-4 w-4 mr-1" />
                                                Approve
                                            </Button>
                                        )}
                                        {loan.status === 2 && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => router.patch(route('loans.activate', loan.id))}
                                                className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                                            >
                                                <TrendingUp className="h-4 w-4 mr-1" />
                                                Activate
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="shadow-sm border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Loan Details
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Borrower
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Amount
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Duration
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Interest Method
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {filteredLoans.map((loan) => (
                                            <tr key={loan.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {loan.loan_id}
                                                        </div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                                            {loan.loan_type}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900 dark:text-white">
                                                        {loan.borrower.first_name} {loan.borrower.last_name}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {loan.borrower.borrower_id}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900 dark:text-white">
                                                        {formatCurrency(loan.principal_amount)}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        Total: {formatCurrency(loan.total_amount)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900 dark:text-white">
                                                        {loan.loan_duration} months
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {loan.interest_rate}% interest
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900 dark:text-white capitalize">
                                                        {loan.interest_method || 'Simple'}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        Interest calculation
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getStatusBadge(loan.status)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => router.get(route('loans.show', loan.id))}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        {loan.status === 1 && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => router.patch(route('loans.approve', loan.id))}
                                                                className="text-green-600 border-green-200 hover:bg-green-50"
                                                            >
                                                                <CheckCircle className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {loan.status === 2 && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => router.patch(route('loans.activate', loan.id))}
                                                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                                            >
                                                                <TrendingUp className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Empty State */}
                {filteredLoans.length === 0 && (
                    <Card className="text-center py-12 shadow-sm border-gray-200">
                        <CardContent>
                            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No loans found</h3>
                            <p className="text-gray-500 mb-4">
                                {searchTerm || statusFilter !== 'all' 
                                    ? 'Try adjusting your search or filter criteria.' 
                                    : 'Get started by adding your first loan.'}
                            </p>
                            {!searchTerm && statusFilter === 'all' && eligibleBorrowers.length > 0 && (
                                <Button 
                                    onClick={() => setIsModalOpen(true)}
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add First Loan
                                </Button>
                            )}
                            {eligibleBorrowers.length === 0 && (
                                <p className="text-sm text-gray-500 mt-2">
                                    No eligible borrowers available. Borrowers must have completed requirements to be eligible for loans.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Add New Loan Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="w-full max-w-4xl mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 rounded-t-2xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Loan</h3>
                                        <p className="text-gray-600 dark:text-gray-300 mt-1">Create a new loan application</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleCloseModal}
                                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                    >
                                        ✕
                                    </Button>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Borrower Selection */}
                                    <div className="space-y-4">
                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            <User className="h-5 w-5" />
                                            Borrower Information
                                        </h4>

                                        <div>
                                            <Label htmlFor="borrower_id" className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Borrower</Label>
                                            <Select value={data.borrower_id} onValueChange={(value) => setData('borrower_id', value)}>
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue placeholder="Choose an eligible borrower" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {eligibleBorrowers.map((borrower) => (
                                                        <SelectItem key={borrower.id} value={borrower.id.toString()}>
                                                            {borrower.first_name} {borrower.last_name} ({borrower.borrower_id})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <InputError message={errors.borrower_id} className="mt-1" />
                                        </div>
                                    </div>

                                    {/* Loan Details */}
                                    <div className="space-y-4">
                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            <CreditCard className="h-5 w-5" />
                                            Loan Details
                                        </h4>

                                        <div>
                                            <Label htmlFor="loan_type" className="text-sm font-medium text-gray-700 dark:text-gray-300">Loan Type</Label>
                                            <Select value={data.loan_type} onValueChange={(value) => setData('loan_type', value)}>
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="personal">Personal Loan</SelectItem>
                                                    <SelectItem value="business">Business Loan</SelectItem>
                                                    <SelectItem value="emergency">Emergency Loan</SelectItem>
                                                    <SelectItem value="education">Education Loan</SelectItem>
                                                    <SelectItem value="housing">Housing Loan</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <InputError message={errors.loan_type} className="mt-1" />
                                        </div>

                                        <div>
                                            <Label htmlFor="principal_amount" className="text-sm font-medium text-gray-700 dark:text-gray-300">Principal Amount (PHP)</Label>
                                            <Input
                                                id="principal_amount"
                                                type="text"
                                                value={formatNumberWithCommas(data.principal_amount)}
                                                onChange={handlePrincipalAmountChange}
                                                className="mt-1"
                                                placeholder="Enter loan amount"
                                            />
                                            <InputError message={errors.principal_amount} className="mt-1" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Duration & Interest */}
                                    <div className="space-y-4">
                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            <Calendar className="h-5 w-5" />
                                            Duration & Interest
                                        </h4>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="loan_duration" className="text-sm font-medium text-gray-700 dark:text-gray-300">Duration</Label>
                                                <Input
                                                    id="loan_duration"
                                                    type="number"
                                                    min="1"
                                                    max="60"
                                                    value={data.loan_duration}
                                                    onChange={(e) => setData('loan_duration', e.target.value)}
                                                    className="mt-1"
                                                    placeholder="Duration"
                                                />
                                                <InputError message={errors.loan_duration} className="mt-1" />
                                            </div>
                                            <div>
                                                <Label htmlFor="duration_period" className="text-sm font-medium text-gray-700 dark:text-gray-300">Period</Label>
                                                <Select value={data.duration_period} onValueChange={(value) => setData('duration_period', value)}>
                                                    <SelectTrigger className="mt-1">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="months">Months</SelectItem>
                                                        <SelectItem value="years">Years</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <InputError message={errors.duration_period} className="mt-1" />
                                            </div>
                                        </div>

                                        <div>
                            <Label htmlFor="interest_rate" className="text-sm font-medium text-gray-700 dark:text-gray-300">Interest Rate (%)</Label>
                            <Input
                                id="interest_rate"
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={data.interest_rate}
                                onChange={(e) => setData('interest_rate', e.target.value)}
                                className="mt-1"
                                placeholder="Annual interest rate"
                            />
                            <InputError message={errors.interest_rate} className="mt-1" />
                        </div>

                        <div>
                            <Label htmlFor="interest_method" className="text-sm font-medium text-gray-700 dark:text-gray-300">Interest Method</Label>
                            <Select value={data.interest_method} onValueChange={(value) => setData('interest_method', value)}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="simple">Simple Interest</SelectItem>
                                    <SelectItem value="flat">Flat Interest</SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.interest_method} className="mt-1" />
                        </div>

                                        <div>
                                            <Label htmlFor="loan_release_date" className="text-sm font-medium text-gray-700 dark:text-gray-300">Loan Release Date</Label>
                                            <Input
                                                id="loan_release_date"
                                                type="date"
                                                value={data.loan_release_date}
                                                onChange={(e) => setData('loan_release_date', e.target.value)}
                                                className="mt-1"
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                            <InputError message={errors.loan_release_date} className="mt-1" />
                                        </div>
                                    </div>

                                    {/* Additional Information */}
                                    <div className="space-y-4">
                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            <DollarSign className="h-5 w-5" />
                                            Additional Information
                                        </h4>

                                        <div>
                                            <Label htmlFor="purpose" className="text-sm font-medium text-gray-700 dark:text-gray-300">Loan Purpose</Label>
                                            <Textarea
                                                id="purpose"
                                                value={data.purpose}
                                                onChange={(e) => setData('purpose', e.target.value)}
                                                className="mt-1"
                                                placeholder="Describe the purpose of this loan"
                                                rows={3}
                                            />
                                            <InputError message={errors.purpose} className="mt-1" />
                                        </div>

                                        <div>
                                            <Label htmlFor="collateral" className="text-sm font-medium text-gray-700 dark:text-gray-300">Collateral (Optional)</Label>
                                            <Input
                                                id="collateral"
                                                type="text"
                                                value={data.collateral}
                                                onChange={(e) => setData('collateral', e.target.value)}
                                                className="mt-1"
                                                placeholder="Describe any collateral"
                                            />
                                            <InputError message={errors.collateral} className="mt-1" />
                                        </div>

                                        <div>
                                            <Label htmlFor="notes" className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes (Optional)</Label>
                                            <Textarea
                                                id="notes"
                                                value={data.notes}
                                                onChange={(e) => setData('notes', e.target.value)}
                                                className="mt-1"
                                                placeholder="Additional notes or comments"
                                                rows={3}
                                            />
                                            <InputError message={errors.notes} className="mt-1" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleCloseModal}
                                        disabled={processing}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                    >
                                        {processing ? 'Creating...' : 'Create Loan'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}