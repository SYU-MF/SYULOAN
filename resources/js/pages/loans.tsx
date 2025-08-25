import React, { useState, useMemo } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
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
    List,
    Receipt,
    Shield,
    FileText,
    Upload,
    X
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

interface Fee {
    fee_type: string;
    calculate_fee_on: string;
    fee_percentage: string;
    fixed_amount: string;
    [key: string]: any;
}



interface Collateral {
    name: string;
    description: string;
    defects: string;
    files?: File[];
    [key: string]: any;
}

interface Penalty {
    penalty_type: string;
    penalty_rate: string;
    grace_period_days: string;
    penalty_calculation_base: string;
    penalty_name: string;
    description: string;
    [key: string]: any;
}

interface LoanFormData {
    borrower_id: string;
    principal_amount: string;
    loan_duration: string;
    duration_period: string;
    loan_release_date: string;
    interest_rate: string;
    interest_method: string;
    loan_type: string;
    purpose: string;
    notes: string;
    fees: Fee[];
    collaterals: Collateral[];
    penalties: Penalty[];
    [key: string]: any;
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
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

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
        notes: '',
        fees: [] as Fee[],
        collaterals: [] as Collateral[],
        penalties: [] as Penalty[]
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

    // Fee management functions
    const addFee = () => {
        const newFee: Fee = {
            fee_type: 'processing',
            calculate_fee_on: 'principal_amount',
            fee_percentage: '',
            fixed_amount: ''
        };
        setData('fees', [...(data.fees as unknown as Fee[]), newFee]);
    };

    const removeFee = (index: number) => {
        const newFees = (data.fees as unknown as Fee[]).filter((_, i) => i !== index);
        setData('fees', newFees);
    };

    const updateFee = (index: number, field: keyof Fee, value: string) => {
        const newFees = [...(data.fees as unknown as Fee[])];
        newFees[index] = { ...newFees[index], [field]: value };
        setData('fees', newFees);
    };



    // Collateral management functions
    const addCollateral = () => {
        const newCollateral: Collateral = {
            name: '',
            description: '',
            defects: ''
        };
        setData('collaterals', [...(data.collaterals as unknown as Collateral[]), newCollateral]);
    };

    const removeCollateral = (index: number) => {
        const newCollaterals = (data.collaterals as unknown as Collateral[]).filter((_, i) => i !== index);
        setData('collaterals', newCollaterals);
    };

    const updateCollateral = (index: number, field: keyof Collateral, value: string) => {
        const newCollaterals = [...(data.collaterals as unknown as Collateral[])];
        newCollaterals[index] = { ...newCollaterals[index], [field]: value };
        setData('collaterals', newCollaterals);
    };

    // Penalty management functions
    const addPenalty = () => {
        const newPenalty: Penalty = {
            penalty_type: 'percentage',
            penalty_rate: '2.00',
            grace_period_days: '7',
            penalty_calculation_base: 'monthly_payment',
            penalty_name: 'Late Payment Penalty',
            description: ''
        };
        setData('penalties', [...(data.penalties as unknown as Penalty[]), newPenalty]);
    };

    const removePenalty = (index: number) => {
        const newPenalties = (data.penalties as unknown as Penalty[]).filter((_, i) => i !== index);
        setData('penalties', newPenalties);
    };

    const updatePenalty = (index: number, field: keyof Penalty, value: string) => {
        const newPenalties = [...(data.penalties as unknown as Penalty[])];
        newPenalties[index] = { ...newPenalties[index], [field]: value };
        setData('penalties', newPenalties);
    };

    // File upload state for collaterals
    const [collateralFiles, setCollateralFiles] = useState<{[key: number]: File[]}>({});

    const handleCollateralFileChange = (collateralIndex: number, files: FileList | null) => {
        if (files) {
            const fileArray = Array.from(files);
            setCollateralFiles(prev => ({
                ...prev,
                [collateralIndex]: fileArray
            }));
        }
    };

    const removeCollateralFile = (collateralIndex: number, fileIndex: number) => {
        setCollateralFiles(prev => {
            const newFiles = { ...prev };
            if (newFiles[collateralIndex]) {
                newFiles[collateralIndex] = newFiles[collateralIndex].filter((_, index) => index !== fileIndex);
                if (newFiles[collateralIndex].length === 0) {
                    delete newFiles[collateralIndex];
                }
            }
            return newFiles;
        });
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
        setIsConfirmModalOpen(true);
    };

    const handleConfirmSubmit = () => {
        // Create FormData to handle file uploads
        const formData = new FormData();
        
        // Add all form fields
        Object.entries(data).forEach(([key, value]) => {
            if (key === 'fees' || key === 'collaterals' || key === 'penalties') {
                formData.append(key, JSON.stringify(value));
            } else {
                formData.append(key, value as string);
            }
        });
        
        // Add collateral files
        Object.entries(collateralFiles).forEach(([collateralIndex, files]) => {
            files.forEach((file, fileIndex) => {
                formData.append(`collateral_files[${collateralIndex}][${fileIndex}]`, file);
            });
        });
        
        // Use router.post with FormData
        router.post(route('loans.store'), formData, {
            onSuccess: () => {
                reset();
                setCollateralFiles({});
                setIsModalOpen(false);
                setIsConfirmModalOpen(false);
                setIsSuccessModalOpen(true);
            },
            onError: (errors) => {
                console.error('Form submission errors:', errors);
                setIsConfirmModalOpen(false);
            }
        });
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setIsConfirmModalOpen(false);
        setIsSuccessModalOpen(false);
        reset();
        setCollateralFiles({});
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

                            <form onSubmit={handleSubmit} className="p-6 space-y-8">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Borrower Selection */}
                                    <div className="space-y-4">
                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            <User className="h-5 w-5" />
                                            Borrower Information
                                        </h4>

                                        <div>
                                            <Label htmlFor="borrower_id" className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Borrower</Label>
                                            <Select value={data.borrower_id as string || ''} onValueChange={(value) => setData('borrower_id', value)}>
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
                                            <Select value={data.loan_type as string || ''} onValueChange={(value) => setData('loan_type', value)}>
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
                                                value={formatNumberWithCommas(data.principal_amount as string || '')}
                                                onChange={handlePrincipalAmountChange}
                                                className="mt-1"
                                                placeholder="Enter loan amount"
                                            />
                                            <InputError message={errors.principal_amount} className="mt-1" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                </div>
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
                                                    value={data.loan_duration as string || ''}
                                                    onChange={(e) => setData('loan_duration', e.target.value)}
                                                    className="mt-1"
                                                    placeholder="Duration"
                                                />
                                                <InputError message={errors.loan_duration} className="mt-1" />
                                            </div>
                                            <div>
                                                <Label htmlFor="duration_period" className="text-sm font-medium text-gray-700 dark:text-gray-300">Period</Label>
                                                <Select value={data.duration_period as string || ''} onValueChange={(value) => setData('duration_period', value)}>
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
                                value={data.interest_rate as string || ''}
                                onChange={(e) => setData('interest_rate', e.target.value)}
                                className="mt-1"
                                placeholder="Annual interest rate"
                            />
                            <InputError message={errors.interest_rate} className="mt-1" />
                        </div>

                        <div>
                            <Label htmlFor="interest_method" className="text-sm font-medium text-gray-700 dark:text-gray-300">Interest Method</Label>
                            <Select value={data.interest_method as string || ''} onValueChange={(value) => setData('interest_method', value)}>
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
                                                value={data.loan_release_date as string || ''}
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
                                                value={data.purpose as string || ''}
                                                onChange={(e) => setData('purpose', e.target.value)}
                                                className="mt-1"
                                                placeholder="Describe the purpose of this loan"
                                                rows={3}
                                            />
                                            <InputError message={errors.purpose} className="mt-1" />
                                        </div>



                                        <div>
                                            <Label htmlFor="notes" className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes (Optional)</Label>
                                            <Textarea
                                                id="notes"
                                                value={data.notes as string || ''}
                                                onChange={(e) => setData('notes', e.target.value)}
                                                className="mt-1"
                                                placeholder="Additional notes or comments"
                                                rows={3}
                                            />
                                            <InputError message={errors.notes} className="mt-1" />
                                        </div>
                                    </div>

                                {/* Penalties Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                                            <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
                                            Penalties
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={addPenalty}
                                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                                        >
                                            <Plus className="h-4 w-4 mr-1" />
                                            Add Penalty
                                        </button>
                                    </div>
                                    
                                    {(data.penalties as unknown as Penalty[]).map((penalty, index) => (
                                        <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">Penalty #{index + 1}</h4>
                                                <button
                                                    type="button"
                                                    onClick={() => removePenalty(index)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            Penalty Name
                                                        </Label>
                                                        <Input
                                                            type="text"
                                                            value={penalty.penalty_name}
                                                            onChange={(e) => updatePenalty(index, 'penalty_name', e.target.value)}
                                                            className="mt-1"
                                                            placeholder="Late Payment Penalty"
                                                        />
                                                    </div>
                                                    
                                                    <div>
                                                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            Penalty Type
                                                        </Label>
                                                        <Select value={penalty.penalty_type} onValueChange={(value) => updatePenalty(index, 'penalty_type', value)}>
                                                            <SelectTrigger className="mt-1">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="none">No Penalty</SelectItem>
                                                                <SelectItem value="percentage">Percentage</SelectItem>
                                                                <SelectItem value="fixed">Fixed Amount</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    
                                                    {penalty.penalty_type !== 'none' && (
                                                        <>
                                                            <div>
                                                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                    {penalty.penalty_type === 'percentage' ? 'Penalty Rate (%)' : 'Penalty Amount (₱)'}
                                                                </Label>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={penalty.penalty_rate}
                                                                    onChange={(e) => updatePenalty(index, 'penalty_rate', e.target.value)}
                                                                    className="mt-1"
                                                                    placeholder={penalty.penalty_type === 'percentage' ? '2.00' : '100.00'}
                                                                />
                                                            </div>
                                                            
                                                            <div>
                                                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                    Grace Period (Days)
                                                                </Label>
                                                                <Input
                                                                    type="number"
                                                                    value={penalty.grace_period_days}
                                                                    onChange={(e) => updatePenalty(index, 'grace_period_days', e.target.value)}
                                                                    className="mt-1"
                                                                    placeholder="7"
                                                                />
                                                            </div>
                                                            
                                                            {penalty.penalty_type === 'percentage' && (
                                                                <div>
                                                                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                        Calculate Penalty On
                                                                    </Label>
                                                                    <Select value={penalty.penalty_calculation_base} onValueChange={(value) => updatePenalty(index, 'penalty_calculation_base', value)}>
                                                                        <SelectTrigger className="mt-1">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="principal_amount">Principal Amount</SelectItem>
                                                                            <SelectItem value="remaining_balance">Remaining Balance</SelectItem>
                                                                            <SelectItem value="monthly_payment">Monthly Payment</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                    
                                                    <div className="md:col-span-2">
                                                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            Description
                                                        </Label>
                                                        <Textarea
                                                            value={penalty.description}
                                                            onChange={(e) => updatePenalty(index, 'description', e.target.value)}
                                                            className="mt-1"
                                                            placeholder="Penalty description..."
                                                            rows={2}
                                                        />
                                                    </div>
                                                </div>
                                                
                                                {penalty.penalty_type !== 'none' && (
                                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                                                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                                            <strong>Penalty Preview:</strong> {penalty.penalty_type === 'percentage' 
                                                                ? `${penalty.penalty_rate}% of ${penalty.penalty_calculation_base?.replace('_', ' ')} per month overdue after ${penalty.grace_period_days} days grace period`
                                                                : `₱${penalty.penalty_rate} fixed penalty per month overdue after ${penalty.grace_period_days} days grace period`
                                                            }
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                {/* Fees Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                                            <Receipt className="h-5 w-5 mr-2 text-blue-600" />
                                            Fees
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={addFee}
                                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            <Plus className="h-4 w-4 mr-1" />
                                            Add Fee
                                        </button>
                                    </div>
                                    
                                    {(data.fees as unknown as Fee[]).map((fee, index) => (
                                        <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">Fee #{index + 1}</h4>
                                                <button
                                                    type="button"
                                                    onClick={() => removeFee(index)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Fee Type
                                                    </Label>
                                                    <Select value={fee.fee_type} onValueChange={(value) => updateFee(index, 'fee_type', value)}>
                                                        <SelectTrigger className="mt-1">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="processing">Processing Fee</SelectItem>
                                                            <SelectItem value="service">Service Fee</SelectItem>
                                                            <SelectItem value="documentation">Documentation Fee</SelectItem>
                                                            <SelectItem value="other">Other</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                
                                                <div>
                                                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Calculate Fee On
                                                    </Label>
                                                    <Select value={fee.calculate_fee_on} onValueChange={(value) => updateFee(index, 'calculate_fee_on', value)}>
                                                        <SelectTrigger className="mt-1">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="principal_amount">Principal Amount</SelectItem>
                                                            <SelectItem value="total_amount">Total Amount</SelectItem>
                                                            <SelectItem value="monthly_payment">Monthly Payment</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                
                                                <div>
                                                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Fee Percentage (%)
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={fee.fee_percentage}
                                                        onChange={(e) => updateFee(index, 'fee_percentage', e.target.value)}
                                                        className="mt-1"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                                
                                                <div className="md:col-span-2">
                                                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Fixed Amount (₱)
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={fee.fixed_amount}
                                                        onChange={(e) => updateFee(index, 'fixed_amount', e.target.value)}
                                                        className="mt-1"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>



                                {/* Collateral Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                                            <Shield className="h-5 w-5 mr-2 text-green-600" />
                                            Collateral
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={addCollateral}
                                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                        >
                                            <Plus className="h-4 w-4 mr-1" />
                                            Add Collateral
                                        </button>
                                    </div>
                                    
                                    {(data.collaterals as unknown as Collateral[]).map((collateral, index) => (
                                        <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">Collateral #{index + 1}</h4>
                                                <button
                                                    type="button"
                                                    onClick={() => removeCollateral(index)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 gap-4">
                                                <div>
                                                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Collateral Name
                                                    </Label>
                                                    <Input
                                                        type="text"
                                                        value={collateral.name}
                                                        onChange={(e) => updateCollateral(index, 'name', e.target.value)}
                                                        className="mt-1"
                                                        placeholder="Enter collateral name"
                                                    />
                                                </div>
                                                
                                                <div>
                                                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Description
                                                    </Label>
                                                    <Textarea
                                                        value={collateral.description}
                                                        onChange={(e) => updateCollateral(index, 'description', e.target.value)}
                                                        rows={3}
                                                        className="mt-1"
                                                        placeholder="Describe the collateral"
                                                    />
                                                </div>
                                                
                                                <div>
                                                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Defects (Optional)
                                                    </Label>
                                                    <Textarea
                                                        value={collateral.defects}
                                                        onChange={(e) => updateCollateral(index, 'defects', e.target.value)}
                                                        rows={2}
                                                        className="mt-1"
                                                        placeholder="List any defects or issues (optional)"
                                                    />
                                                </div>
                                                
                                                <div>
                                                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Upload Files/Images
                                                    </Label>
                                                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                                                        <div className="space-y-1 text-center">
                                                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                                            <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                                                <label className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                                                    <span>Upload files</span>
                                                                    <input
                                                                        type="file"
                                                                        multiple
                                                                        accept="image/*,.pdf,.doc,.docx"
                                                                        className="sr-only"
                                                                        onChange={(e) => handleCollateralFileChange(index, e.target.files)}
                                                                    />
                                                                </label>
                                                                <p className="pl-1">or drag and drop</p>
                                                            </div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                PNG, JPG, PDF, DOC up to 10MB
                                                            </p>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Display selected files */}
                                                    {collateralFiles[index] && collateralFiles[index].length > 0 && (
                                                        <div className="mt-4 space-y-2">
                                                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Selected Files:</Label>
                                                            <div className="space-y-2">
                                                                {collateralFiles[index].map((file, fileIndex) => (
                                                                    <div key={fileIndex} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                                                                        <div className="flex items-center space-x-2">
                                                                            <FileText className="h-4 w-4 text-gray-500" />
                                                                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{file.name}</span>
                                                                            <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                                                        </div>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => removeCollateralFile(index, fileIndex)}
                                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                                        >
                                                                            <X className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
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

                {/* Confirmation Modal */}
                {isConfirmModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Confirm Loan Creation</h3>
                                    <p className="text-gray-600 dark:text-gray-300 mt-1">Please review the loan details before submitting</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsConfirmModalOpen(false)}
                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    ✕
                                </Button>
                            </div>
                            
                            <div className="p-6 space-y-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Borrower:</span>
                                        <span className="text-gray-900 dark:text-white">
                                            {eligibleBorrowers.find(b => b.id.toString() === data.borrower_id)?.first_name} {eligibleBorrowers.find(b => b.id.toString() === data.borrower_id)?.last_name}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Principal Amount:</span>
                                        <span className="text-gray-900 dark:text-white font-semibold">
                                            ₱{formatNumberWithCommas(data.principal_amount)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Loan Duration:</span>
                                        <span className="text-gray-900 dark:text-white">
                                            {data.loan_duration} {data.duration_period}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Interest Rate:</span>
                                        <span className="text-gray-900 dark:text-white">{data.interest_rate}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Loan Type:</span>
                                        <span className="text-gray-900 dark:text-white capitalize">{data.loan_type}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Release Date:</span>
                                        <span className="text-gray-900 dark:text-white">{data.loan_release_date}</span>
                                    </div>
                                    {data.purpose && (
                                        <div className="flex justify-between">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">Purpose:</span>
                                            <span className="text-gray-900 dark:text-white">{data.purpose}</span>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                                    <div className="flex items-start">
                                        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                                        <div>
                                            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Confirmation Required</h4>
                                            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                                Once submitted, this loan application will be created and cannot be easily modified. Please ensure all details are correct.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsConfirmModalOpen(false)}
                                    disabled={processing}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleConfirmSubmit}
                                    disabled={processing}
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                >
                                    {processing ? 'Creating...' : 'Confirm & Create Loan'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Success Modal */}
                {isSuccessModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                            <div className="p-6 text-center">
                                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Loan Created Successfully!</h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-6">
                                    The loan application has been created and is now pending approval. The borrower will be notified of the status.
                                </p>
                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                                    <div className="flex items-center justify-center">
                                        <div className="text-center">
                                            <p className="text-sm font-medium text-green-800 dark:text-green-200">Next Steps</p>
                                            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                                                Review and approve the loan in the loans management section
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => setIsSuccessModalOpen(false)}
                                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                                >
                                    Continue
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}