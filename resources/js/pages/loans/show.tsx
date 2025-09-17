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
    Calculator,
    Receipt,
    History,
    XCircle,
    Shield,
    Download,
    File,
    Image
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
    fixed_amount?: number;
}

interface LoanCollateral {
    id: number;
    loan_id: number;
    name: string;
    description: string;
    defects?: string;
    file_paths?: string[];
    created_at: string;
    updated_at: string;
}

interface Payment {
    id: number;
    payment_id: string;
    loan_id: number;
    amount: number;
    payment_date: string;
    payment_type: string;
    payment_method: string;
    status: string;
    principal_amount?: number;
    interest_amount?: number;
    penalty_amount?: number;
    remaining_balance?: number;
    reference_number?: string;
    notes?: string;
    processed_by?: number;
    processed_at?: string;
    processed_by_user?: {
        id: number;
        name: string;
        email: string;
    };
}

interface VehicleInfo {
    id: number;
    loan_id: number;
    vehicle_make: string;
    vehicle_model: string;
    vehicle_type: string;
    year_of_manufacture: number;
    color: string;
    plate_number: string;
    chassis_number: string;
    engine_number: string;
    created_at: string;
    updated_at: string;
}

interface LuxuryInfo {
    id: number;
    loan_id: number;
    item_type: string;
    brand: string;
    model_collection_name: string;
    material?: string;
    serial_number?: string;
    certificate_number?: string;
    year_purchased?: number;
    year_released?: number;
    proof_of_authenticity?: string;
    receipt_upload?: string;
    created_at: string;
    updated_at: string;
}

interface GadgetInfo {
    id: number;
    loan_id: number;
    gadget_type: string;
    brand: string;
    model_series: string;
    specifications?: string;
    serial_number?: string;
    imei?: string;
    color_variant?: string;
    year_purchased?: number;
    year_released?: number;
    warranty_details?: string;
    proof_of_purchase?: string;
    receipt_upload?: string;
    created_at: string;
    updated_at: string;
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
    collaterals?: LoanCollateral[];
    payments?: Payment[];
    vehicleInfo?: VehicleInfo[];
    luxuryInfo?: LuxuryInfo[];
    gadgetInfo?: GadgetInfo[];
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

const getNextPaymentDate = (releaseDate: string, payments?: Payment[]) => {
    const release = new Date(releaseDate);
    const today = new Date();
    
    // Count completed payments to determine which payment is next
    const completedPayments = payments?.filter(payment => payment.status === 'completed') || [];
    const paymentsCount = completedPayments.length;
    
    // Calculate the next payment date based on completed payments
    // First payment is 1 month after release, second is 2 months, etc.
    const nextPayment = new Date(release);
    nextPayment.setMonth(release.getMonth() + paymentsCount + 1);
    
    return nextPayment;
};

const getLastPaymentInfo = (payments?: Payment[]) => {
    const completedPayments = payments?.filter(payment => payment.status === 'completed') || [];
    
    if (completedPayments.length === 0) {
        return null;
    }
    
    // Sort by payment date to get the most recent
    const sortedPayments = completedPayments.sort((a, b) => 
        new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
    );
    
    const lastPayment = sortedPayments[0];
    const paymentNumber = completedPayments.length;
    
    return {
        date: lastPayment.payment_date,
        paymentNumber,
        amount: lastPayment.amount
    };
};

const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
        'pending': { label: 'Pending', variant: 'secondary' as const, icon: Clock },
        'completed': { label: 'Completed', variant: 'default' as const, icon: CheckCircle },
        'failed': { label: 'Failed', variant: 'destructive' as const, icon: XCircle },
        'cancelled': { label: 'Cancelled', variant: 'destructive' as const, icon: XCircle },
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

const formatPaymentType = (type: string) => {
    const typeMap = {
        'regular': 'Regular Payment',
        'partial': 'Partial Payment',
        'full': 'Full Payment',
        'penalty': 'Regular with Penalty Payment',
        'advance': 'Advance Payment'
    };
    return typeMap[type as keyof typeof typeMap] || type;
};

const formatPaymentMethod = (method: string) => {
    const methodMap = {
        'cash': 'Cash',
        'bank_transfer': 'Bank Transfer',
        'check': 'Check',
        'online': 'Online',
        'gcash': 'GCash',
        'paymaya': 'PayMaya'
    };
    return methodMap[method as keyof typeof methodMap] || method;
};

export default function LoanShow({ loan }: LoanShowPageProps) {
    const [isCalculationModalOpen, setIsCalculationModalOpen] = useState(false);

    const calculateFeeAmount = (fee: LoanFee) => {
        if (fee.fixed_amount) {
            return fee.fixed_amount;
        }
        return 0;
    };

    const totalFees = loan.fees?.reduce((total, fee) => total + calculateFeeAmount(fee), 0) || 0;
    const completedPayments = loan.payments?.filter(payment => payment.status === 'completed') || [];
    const totalPaid = completedPayments.reduce((total, payment) => {
        const amount = Number(payment.amount) || 0;
        return total + amount;
    }, 0);
    const remainingBalance = Math.max(0, (Number(loan.total_amount) || 0) - totalPaid);

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
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {loan.interest_method === 'flat_annual' ? 'Flat Annual Rate' : 
                                                 loan.interest_method === 'flat_one_time' ? 'Flat One-Time Rate' : 
                                                 loan.interest_method || 'Flat Annual Rate'}
                                            </p>
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
                                                      {getNextPaymentDate(loan.loan_release_date, loan.payments).toLocaleDateString('en-US', {
                                                          year: 'numeric',
                                                          month: 'long',
                                                          day: 'numeric'
                                                      })}
                                                  </p>
                                              </div>
                                          )}
                                        {(() => {
                                            const lastPaymentInfo = getLastPaymentInfo(loan.payments);
                                            return lastPaymentInfo ? (
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Last Payment</p>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {new Date(lastPaymentInfo.date).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })} (Payment #{lastPaymentInfo.paymentNumber})
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        Amount: {formatCurrency(lastPaymentInfo.amount)}
                                                    </p>
                                                </div>
                                            ) : null;
                                        })()}
                                        {loan.purpose && (
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Purpose</p>
                                                <p className="font-medium text-gray-900 dark:text-white">{loan.purpose}</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Vehicle Information Section */}
                                    {loan.vehicleInfo && loan.vehicleInfo.length > 0 && (
                                        <div className="mt-4">
                                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center mb-3">
                                                <CreditCard className="h-4 w-4 mr-1" />
                                                Vehicle Information
                                            </p>
                                            {loan.vehicleInfo.map((vehicle) => (
                                                <div key={vehicle.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">Make & Model</p>
                                                            <p className="font-medium text-gray-900 dark:text-white">
                                                                {vehicle.vehicle_make} {vehicle.vehicle_model}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
                                                            <p className="font-medium text-gray-900 dark:text-white">{vehicle.vehicle_type}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">Year</p>
                                                            <p className="font-medium text-gray-900 dark:text-white">{vehicle.year_of_manufacture}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">Color</p>
                                                            <p className="font-medium text-gray-900 dark:text-white">{vehicle.color}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">Plate Number</p>
                                                            <p className="font-medium text-gray-900 dark:text-white">{vehicle.plate_number}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">Chassis Number</p>
                                                            <p className="font-medium text-gray-900 dark:text-white">{vehicle.chassis_number}</p>
                                                        </div>
                                                        <div className="col-span-2">
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">Engine Number</p>
                                                            <p className="font-medium text-gray-900 dark:text-white">{vehicle.engine_number}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {/* Luxury Information Section */}
                                    {loan.luxuryInfo && loan.luxuryInfo.length > 0 && (
                                        <div className="mt-4">
                                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center mb-3">
                                                <CreditCard className="h-4 w-4 mr-1" />
                                                Luxury Item Information
                                            </p>
                                            {loan.luxuryInfo.map((luxury) => (
                                                <div key={luxury.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">Item Type</p>
                                                            <p className="font-medium text-gray-900 dark:text-white capitalize">
                                                                {luxury.item_type.replace('_', ' ')}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">Brand</p>
                                                            <p className="font-medium text-gray-900 dark:text-white">{luxury.brand}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">Model/Collection</p>
                                                            <p className="font-medium text-gray-900 dark:text-white">{luxury.model_collection_name}</p>
                                                        </div>
                                                        {luxury.material && (
                                                            <div>
                                                                <p className="text-sm text-gray-500 dark:text-gray-400">Material</p>
                                                                <p className="font-medium text-gray-900 dark:text-white">{luxury.material}</p>
                                                            </div>
                                                        )}
                                                        {luxury.serial_number && (
                                                            <div>
                                                                <p className="text-sm text-gray-500 dark:text-gray-400">Serial Number</p>
                                                                <p className="font-medium text-gray-900 dark:text-white">{luxury.serial_number}</p>
                                                            </div>
                                                        )}
                                                        {luxury.certificate_number && (
                                                            <div>
                                                                <p className="text-sm text-gray-500 dark:text-gray-400">Certificate Number</p>
                                                                <p className="font-medium text-gray-900 dark:text-white">{luxury.certificate_number}</p>
                                                            </div>
                                                        )}
                                                        {luxury.year_purchased && (
                                                            <div>
                                                                <p className="text-sm text-gray-500 dark:text-gray-400">Year Purchased</p>
                                                                <p className="font-medium text-gray-900 dark:text-white">{luxury.year_purchased}</p>
                                                            </div>
                                                        )}
                                                        {luxury.year_released && (
                                                            <div>
                                                                <p className="text-sm text-gray-500 dark:text-gray-400">Year Released</p>
                                                                <p className="font-medium text-gray-900 dark:text-white">{luxury.year_released}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {/* Gadget Information Section */}
                                    {loan.gadgetInfo && loan.gadgetInfo.length > 0 && (
                                        <div className="mt-4">
                                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center mb-3">
                                                <CreditCard className="h-4 w-4 mr-1" />
                                                Gadget Information
                                            </p>
                                            {loan.gadgetInfo.map((gadget) => (
                                                <div key={gadget.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">Gadget Type</p>
                                                            <p className="font-medium text-gray-900 dark:text-white">{gadget.gadget_type}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">Brand</p>
                                                            <p className="font-medium text-gray-900 dark:text-white">{gadget.brand}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">Model/Series</p>
                                                            <p className="font-medium text-gray-900 dark:text-white">{gadget.model_series}</p>
                                                        </div>
                                                        {gadget.specifications && (
                                                            <div>
                                                                <p className="text-sm text-gray-500 dark:text-gray-400">Specifications</p>
                                                                <p className="font-medium text-gray-900 dark:text-white">{gadget.specifications}</p>
                                                            </div>
                                                        )}
                                                        {gadget.serial_number && (
                                                            <div>
                                                                <p className="text-sm text-gray-500 dark:text-gray-400">Serial Number</p>
                                                                <p className="font-medium text-gray-900 dark:text-white">{gadget.serial_number}</p>
                                                            </div>
                                                        )}
                                                        {gadget.imei && (
                                                            <div>
                                                                <p className="text-sm text-gray-500 dark:text-gray-400">IMEI</p>
                                                                <p className="font-medium text-gray-900 dark:text-white">{gadget.imei}</p>
                                                            </div>
                                                        )}
                                                        {gadget.color_variant && (
                                                            <div>
                                                                <p className="text-sm text-gray-500 dark:text-gray-400">Color</p>
                                                                <p className="font-medium text-gray-900 dark:text-white">{gadget.color_variant}</p>
                                                            </div>
                                                        )}
                                                        {gadget.year_purchased && (
                                                            <div>
                                                                <p className="text-sm text-gray-500 dark:text-gray-400">Year Purchased</p>
                                                                <p className="font-medium text-gray-900 dark:text-white">{gadget.year_purchased}</p>
                                                            </div>
                                                        )}
                                                        {gadget.year_released && (
                                                            <div>
                                                                <p className="text-sm text-gray-500 dark:text-gray-400">Year Released</p>
                                                                <p className="font-medium text-gray-900 dark:text-white">{gadget.year_released}</p>
                                                            </div>
                                                        )}
                                                        {gadget.warranty_details && (
                                                            <div className="col-span-2">
                                                                <p className="text-sm text-gray-500 dark:text-gray-400">Warranty Details</p>
                                                                <p className="font-medium text-gray-900 dark:text-white">{gadget.warranty_details}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {loan.collaterals && loan.collaterals.length > 0 && (
                                        <div className="mt-4">
                                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center mb-3">
                                                <Shield className="h-4 w-4 mr-1" />
                                                Collateral ({loan.collaterals.length})
                                            </p>
                                            <div className="space-y-3">
                                                {loan.collaterals.map((collateral, index) => (
                                                    <div key={collateral.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h4 className="font-medium text-gray-900 dark:text-white">
                                                                {collateral.name}
                                                            </h4>
                                                            <Badge variant="outline" className="text-xs">
                                                                #{index + 1}
                                                            </Badge>
                                                        </div>
                                                        
                                                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                                            {collateral.description}
                                                        </p>
                                                        
                                                        {collateral.defects && (
                                                            <div className="mb-2">
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">Defects:</p>
                                                                <p className="text-sm text-orange-600 dark:text-orange-400">
                                                                    {collateral.defects}
                                                                </p>
                                                            </div>
                                                        )}
                                                        
                                                        {collateral.file_paths && collateral.file_paths.length > 0 && (
                                                            <div className="mt-2">
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                                                    Attached Files ({collateral.file_paths.length}):
                                                                </p>
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                    {collateral.file_paths.map((filePath, fileIndex) => {
                                                                        const fileName = filePath.split('/').pop() || filePath;
                                                                        const fileExtension = fileName.split('.').pop()?.toLowerCase();
                                                                        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '');
                                                                        
                                                                        return (
                                                                            <div key={fileIndex} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded border">
                                                                                {isImage ? (
                                                                                    <Image className="h-4 w-4 text-blue-500" />
                                                                                ) : (
                                                                                    <File className="h-4 w-4 text-gray-500" />
                                                                                )}
                                                                                <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">
                                                                                    {fileName}
                                                                                </span>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() => {
                                                                                        const link = document.createElement('a');
                                                                                        link.href = `/storage/${filePath}`;
                                                                                        link.download = fileName;
                                                                                        link.target = '_blank';
                                                                                        document.body.appendChild(link);
                                                                                        link.click();
                                                                                        document.body.removeChild(link);
                                                                                    }}
                                                                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                                                                >
                                                                                    <Download className="h-3 w-3" />
                                                                                </Button>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
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

                            {/* Payment Summary */}
                            <Card className="dark:bg-gray-800 dark:border-gray-700">
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                                        <Receipt className="h-5 w-5" />
                                        <span>Payment Summary</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Paid</p>
                                            <p className="text-xl font-bold text-green-600 dark:text-green-400">
                                                {formatCurrency(totalPaid)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Remaining Balance</p>
                                            <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                                                {formatCurrency(remainingBalance)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Payments</p>
                                            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                                {completedPayments.length}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Payment History */}
                            <Card className="dark:bg-gray-800 dark:border-gray-700">
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                                        <History className="h-5 w-5" />
                                        <span>Payment History</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {loan.payments && loan.payments.length > 0 ? (
                                        <div className="space-y-4">
                                            {loan.payments.map((payment) => (
                                                <div key={payment.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <h4 className="font-medium text-gray-900 dark:text-white">
                                                                    {payment.payment_id}
                                                                </h4>
                                                                {getPaymentStatusBadge(payment.status)}
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                                                                <div>
                                                                    <p className="text-gray-500 dark:text-gray-400">Amount</p>
                                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                                        {formatCurrency(payment.amount)}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-gray-500 dark:text-gray-400">Date</p>
                                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                                        {new Date(payment.payment_date).toLocaleDateString('en-US', {
                                                                            year: 'numeric',
                                                                            month: 'short',
                                                                            day: 'numeric'
                                                                        })}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-gray-500 dark:text-gray-400">Type</p>
                                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                                        {formatPaymentType(payment.payment_type)}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-gray-500 dark:text-gray-400">Method</p>
                                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                                        {formatPaymentMethod(payment.payment_method)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {payment.notes && (
                                                                <div className="mt-2">
                                                                    <p className="text-gray-500 dark:text-gray-400 text-sm">Notes</p>
                                                                    <p className="text-gray-900 dark:text-white text-sm">{payment.notes}</p>
                                                                </div>
                                                            )}
                                                            {payment.reference_number && (
                                                                <div className="mt-2">
                                                                    <p className="text-gray-500 dark:text-gray-400 text-sm">Reference</p>
                                                                    <p className="text-gray-900 dark:text-white text-sm font-mono">{payment.reference_number}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {payment.remaining_balance !== undefined && (
                                                            <div className="text-right">
                                                                <p className="text-gray-500 dark:text-gray-400 text-sm">Balance After</p>
                                                                <p className="font-bold text-lg text-gray-900 dark:text-white">
                                                                    {formatCurrency(payment.remaining_balance)}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-500 dark:text-gray-400">No payments recorded yet</p>
                                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                                Payment history will appear here once payments are made
                                            </p>
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