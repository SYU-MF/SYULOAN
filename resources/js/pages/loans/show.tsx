import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
    ArrowLeft, 
    User, 
    CreditCard, 
    Calendar, 
    DollarSign, 
    TrendingUp,
    Clock,
    CheckCircle,
    AlertTriangle,
    FileText,
    Calculator
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

interface LoanFee {
    id: number;
    loan_id: number;
    fee_type: string;
    calculate_fee_on: string;
    fee_percentage?: number;
    fixed_amount?: number;
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
    released_amount: number;
    monthly_payment: number;
    loan_type: string;
    purpose?: string;
    collateral?: string;
    status: number;
    due_date: string;
    notes?: string;
    created_at: string;
    updated_at: string;
    fees?: LoanFee[];
}

interface LoanShowPageProps {
    loan: Loan;
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
    const statusConfig = {
        1: { label: 'Pending', variant: 'secondary' as const, icon: Clock },
        2: { label: 'Approved', variant: 'default' as const, icon: CheckCircle },
        3: { label: 'Active', variant: 'default' as const, icon: TrendingUp },
        4: { label: 'Completed', variant: 'default' as const, icon: CheckCircle },
        5: { label: 'Defaulted', variant: 'destructive' as const, icon: AlertTriangle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
        label: 'Unknown',
        variant: 'secondary' as const,
        icon: AlertTriangle
    };

    const IconComponent = config.icon;

    return (
        <Badge variant={config.variant} className="flex items-center gap-1">
            <IconComponent className="h-3 w-3" />
            {config.label}
        </Badge>
    );
};

const getNextPaymentDate = (releaseDate: string) => {
    const release = new Date(releaseDate);
    const today = new Date();
    
    // Start with the release date and add one month for the first payment
    const nextPayment = new Date(release);
    nextPayment.setMonth(release.getMonth() + 1);
    
    // If the first payment date has already passed, keep adding months until we get a future date
    while (nextPayment <= today) {
        nextPayment.setMonth(nextPayment.getMonth() + 1);
    }
    
    return nextPayment;
};

export default function LoanShow({ loan }: LoanShowPageProps) {
    const [isCalculationModalOpen, setIsCalculationModalOpen] = useState(false);

    const calculateFeeAmount = (fee: LoanFee) => {
        if (fee.fee_percentage) {
            const baseAmount = fee.calculate_fee_on === 'principal' ? loan.principal_amount : loan.total_amount;
            return (baseAmount * fee.fee_percentage / 100);
        } else if (fee.fixed_amount) {
            return fee.fixed_amount;
        }
        return 0;
    };

    const totalFees = loan.fees?.reduce((total, fee) => total + calculateFeeAmount(fee), 0) || 0;

    return (
        <AppLayout>
            <Head title={`Loan Details - ${loan.loan_id}`} />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.get(route('loans.index'))}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Loans
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{loan.loan_id}</h1>
                            <p className="text-gray-600 dark:text-gray-300 mt-1">Loan Details and Information</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {getStatusBadge(loan.status)}
                        {loan.status === 1 && (
                            <Button
                                onClick={() => router.patch(route('loans.approve', loan.id))}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve Loan
                            </Button>
                        )}
                        {loan.status === 2 && (
                            <Button
                                onClick={() => router.patch(route('loans.activate', loan.id))}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                <TrendingUp className="h-4 w-4 mr-2" />
                                Activate Loan
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Borrower Information */}
                    <div className="lg:col-span-1">
                        <Card className="dark:bg-gray-800 dark:border-gray-700">
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                                    <User className="h-5 w-5" />
                                    <span>Borrower Information</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Borrower ID</p>
                                    <p className="font-medium text-gray-900 dark:text-white">{loan.borrower.borrower_id}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Full Name</p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {loan.borrower.first_name} {loan.borrower.middle_name} {loan.borrower.last_name}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                                    <p className="font-medium text-gray-900 dark:text-white">{loan.borrower.email}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                                    <p className="font-medium text-gray-900 dark:text-white">{loan.borrower.phone}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Loan Details */}
                    <div className="lg:col-span-2">
                        <div className="space-y-6">
                            {/* Financial Information */}
                            <Card className="dark:bg-gray-800 dark:border-gray-700">
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                                        <DollarSign className="h-5 w-5" />
                                        <span>Financial Details</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Principal Amount</p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                {formatCurrency(loan.principal_amount)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Amount</p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                {formatCurrency(loan.total_amount)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Released Amount</p>
                                            <Dialog open={isCalculationModalOpen} onOpenChange={setIsCalculationModalOpen}>
                                                <DialogTrigger asChild>
                                                    <button className="text-2xl font-bold text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors cursor-pointer flex items-center gap-2">
                                                        {formatCurrency(loan.released_amount)}
                                                        <Calculator className="h-5 w-5" />
                                                    </button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-md">
                                                    <DialogHeader>
                                                        <DialogTitle>Released Amount Calculation</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="space-y-4">
                                                        <div className="flex justify-between items-center py-2 border-b">
                                                            <span className="font-medium">Principal Amount:</span>
                                                            <span className="text-green-600 font-semibold">{formatCurrency(loan.principal_amount)}</span>
                                                        </div>
                                                        
                                                        {loan.fees && loan.fees.length > 0 ? (
                                                            <>
                                                                <div className="space-y-2">
                                                                    <h4 className="font-medium text-gray-700 dark:text-gray-300">Fees Deducted:</h4>
                                                                    {loan.fees.map((fee, index) => (
                                                                        <div key={index} className="flex justify-between items-center text-sm">
                                                                            <span className="capitalize">{fee.fee_type.replace('_', ' ')}:</span>
                                                                            <span className="text-red-600 font-medium">-{formatCurrency(calculateFeeAmount(fee))}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                
                                                                <div className="flex justify-between items-center py-2 border-t border-b font-medium">
                                                                    <span>Total Fees:</span>
                                                                    <span className="text-red-600">-{formatCurrency(totalFees)}</span>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="text-center text-gray-500 py-4">
                                                                No fees applied to this loan
                                                            </div>
                                                        )}
                                                        
                                                        <div className="flex justify-between items-center py-3 bg-green-50 dark:bg-green-900/20 rounded-lg px-4 font-bold text-lg">
                                                            <span>Released Amount:</span>
                                                            <span className="text-green-600 dark:text-green-400">{formatCurrency(loan.released_amount)}</span>
                                                        </div>
                                                        
                                                        <div className="text-xs text-gray-500 text-center">
                                                            Released Amount = Principal Amount - Total Fees
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Payment</p>
                                            <p className="text-xl font-semibold text-gray-900 dark:text-white">
                                                {formatCurrency(loan.monthly_payment)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Interest Rate</p>
                                            <p className="text-xl font-semibold text-gray-900 dark:text-white">
                                                {loan.interest_rate}%
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Loan Information */}
                            <Card className="dark:bg-gray-800 dark:border-gray-700">
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                                        <CreditCard className="h-5 w-5" />
                                        <span>Loan Information</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Loan Type</p>
                                            <p className="font-medium text-gray-900 dark:text-white capitalize">{loan.loan_type}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Interest Method</p>
                                            <p className="font-medium text-gray-900 dark:text-white capitalize">{loan.interest_method}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {loan.loan_duration} {loan.duration_period}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Release Date</p>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {new Date(loan.loan_release_date).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Due Date to Complete</p>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {new Date(loan.due_date).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                        {loan.status === 3 && (
                                              <div>
                                                  <p className="text-sm text-gray-500 dark:text-gray-400">Next Payment Due</p>
                                                  <p className="font-medium text-gray-900 dark:text-white">
                                                      {getNextPaymentDate(loan.loan_release_date).toLocaleDateString('en-US', {
                                                          year: 'numeric',
                                                          month: 'long',
                                                          day: 'numeric'
                                                      })}
                                                  </p>
                                              </div>
                                          )}
                                        {loan.purpose && (
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Purpose</p>
                                                <p className="font-medium text-gray-900 dark:text-white">{loan.purpose}</p>
                                            </div>
                                        )}
                                    </div>
                                    {loan.collateral && (
                                        <div className="mt-4">
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Collateral</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{loan.collateral}</p>
                                        </div>
                                    )}
                                    {loan.notes && (
                                        <div className="mt-4">
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Notes</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{loan.notes}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Timeline */}
                            <Card className="dark:bg-gray-800 dark:border-gray-700">
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                                        <Calendar className="h-5 w-5" />
                                        <span>Timeline</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">Loan Created</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {new Date(loan.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">Last Updated</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {new Date(loan.updated_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}