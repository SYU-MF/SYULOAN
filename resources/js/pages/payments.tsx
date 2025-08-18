import React, { useState, useMemo } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import jsPDF from 'jspdf';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
    Banknote,
    FileText,
    Download
} from 'lucide-react';

interface Borrower {
    id: number;
    borrower_id: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    email: string;
    phone: string;
}

interface Loan {
    id: number;
    loan_id: string;
    borrower: Borrower;
    principal_amount: number;
    total_amount: number;
    monthly_payment: number;
    loan_duration: number;
    interest_rate: number;
    status: number;
    loan_release_date: string;
}

interface Payment {
    id: number;
    payment_id: string;
    loan: Loan;
    amount: number;
    payment_date: string;
    payment_type: string;
    payment_method: string;
    status: string;
    principal_amount: number;
    interest_amount: number;
    penalty_amount: number;
    remaining_balance: number;
    reference_number?: string;
    notes?: string;
    processed_by?: {
        id: number;
        name: string;
    };
    processed_at?: string;
    created_at: string;
}

interface PaymentsPageProps {
    payments: Payment[];
    activeLoans: Loan[];
    statistics: {
        totalPayments: number;
        totalAmount: number;
        pendingPayments: number;
        completedPayments: number;
        monthlyCollection: number;
    };
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

const getStatusBadge = (status: string) => {
    const statusConfig = {
        pending: { label: 'Pending', variant: 'secondary' as const, icon: Clock },
        completed: { label: 'Completed', variant: 'default' as const, icon: CheckCircle },
        failed: { label: 'Failed', variant: 'destructive' as const, icon: AlertTriangle },
        cancelled: { label: 'Cancelled', variant: 'outline' as const, icon: AlertTriangle },
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

const getPaymentTypeBadge = (type: string) => {
    const typeConfig = {
        regular: { label: 'Regular', variant: 'default' as const },
        partial: { label: 'Partial', variant: 'secondary' as const },
        full: { label: 'Full Payment', variant: 'default' as const },
        penalty: { label: 'Penalty', variant: 'destructive' as const },
        advance: { label: 'Advance', variant: 'outline' as const },
    };

    const config = typeConfig[type as keyof typeof typeConfig] || {
        label: 'Unknown',
        variant: 'secondary' as const
    };

    return (
        <Badge variant={config.variant}>
            {config.label}
        </Badge>
    );
};

export default function PaymentsPage({ payments, activeLoans, statistics }: PaymentsPageProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        loan_id: '',
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_type: 'regular',
        payment_method: 'cash',
        reference_number: '',
        notes: '',
    });

    const filteredPayments = useMemo(() => {
        return payments.filter(payment => {
            const matchesSearch = 
                payment.payment_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                payment.loan.loan_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                payment.loan.borrower.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                payment.loan.borrower.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                payment.loan.borrower.borrower_id.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
            const matchesType = typeFilter === 'all' || payment.payment_type === typeFilter;
            
            return matchesSearch && matchesStatus && matchesType;
        });
    }, [payments, searchTerm, statusFilter, typeFilter]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('payments.store'), {
            onSuccess: () => {
                reset();
                setIsAddModalOpen(false);
            },
        });
    };

    const handleViewPayment = (payment: Payment) => {
        setSelectedPayment(payment);
        setIsViewModalOpen(true);
    };

    const downloadReceipt = (payment: Payment) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // Colors
        const primaryColor = [34, 197, 94]; // Green
        const secondaryColor = [75, 85, 99]; // Gray
        const lightGray = [243, 244, 246];
        
        // Header Background
doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(0, 0, pageWidth, 40, 'F');
        
        // Company Logo/Title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('SYU LOAN', 20, 25);
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Payment Receipt', 20, 32);
        
        // Receipt Info (Top Right)
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text(`Receipt #: ${payment.payment_id}`, pageWidth - 20, 20, { align: 'right' });
        doc.text(`Date: ${new Date(payment.payment_date).toLocaleDateString()}`, pageWidth - 20, 27, { align: 'right' });
        doc.text(`Status: ${payment.status.toUpperCase()}`, pageWidth - 20, 34, { align: 'right' });
        
        // Reset text color for body
        doc.setTextColor(0, 0, 0);
        
        // Borrower Information Section
        let yPos = 60;
doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
        doc.rect(20, yPos - 5, pageWidth - 40, 25, 'F');
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.text('BORROWER INFORMATION', 25, yPos + 5);
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        yPos += 15;
        doc.text(`Name: ${payment.loan.borrower.first_name} ${payment.loan.borrower.middle_name || ''} ${payment.loan.borrower.last_name}`, 25, yPos);
        yPos += 7;
        doc.text(`Borrower ID: ${payment.loan.borrower.borrower_id}`, 25, yPos);
        doc.text(`Loan ID: ${payment.loan.loan_id}`, pageWidth - 25, yPos, { align: 'right' });
        
        // Payment Details Section
        yPos += 20;
        doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
        doc.rect(20, yPos - 5, pageWidth - 40, 25, 'F');
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.text('PAYMENT DETAILS', 25, yPos + 5);
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        yPos += 20;
        
        // Payment breakdown table
        const tableData = [
            ['Payment Type:', payment.payment_type.charAt(0).toUpperCase() + payment.payment_type.slice(1)],
            ['Payment Method:', payment.payment_method.replace('_', ' ').toUpperCase()],
            ['Principal Amount:', formatCurrency(payment.principal_amount)],
            ['Interest Amount:', formatCurrency(payment.interest_amount)],
            ['Penalty Amount:', formatCurrency(payment.penalty_amount)],
            ['Total Payment:', formatCurrency(payment.amount)],
            ['Remaining Balance:', formatCurrency(payment.remaining_balance)]
        ];
        
        if (payment.reference_number) {
            tableData.splice(2, 0, ['Reference Number:', payment.reference_number]);
        }
        
        tableData.forEach(([label, value]) => {
            doc.text(label, 25, yPos);
            doc.setFont('helvetica', 'bold');
            doc.text(value, pageWidth - 25, yPos, { align: 'right' });
            doc.setFont('helvetica', 'normal');
            yPos += 8;
        });
        
        // Total Amount Highlight
        yPos += 5;
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(20, yPos - 5, pageWidth - 40, 15, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL PAID:', 25, yPos + 5);
        doc.text(formatCurrency(payment.amount), pageWidth - 25, yPos + 5, { align: 'right' });
        
        // Notes Section (if exists)
        if (payment.notes) {
            yPos += 25;
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Notes:', 25, yPos);
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const splitNotes = doc.splitTextToSize(payment.notes, pageWidth - 50);
            doc.text(splitNotes, 25, yPos + 8);
            yPos += splitNotes.length * 5 + 8;
        }
        
        // Footer
        const footerY = pageHeight - 30;
        doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.line(20, footerY - 10, pageWidth - 20, footerY - 10);
        
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('This is an official payment receipt generated by SYU Loan Management System.', pageWidth / 2, footerY, { align: 'center' });
        doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, footerY + 5, { align: 'center' });
        
        if (payment.processed_by) {
            doc.text(`Processed by: ${payment.processed_by.name}`, pageWidth / 2, footerY + 10, { align: 'center' });
        }
        
        // Save the PDF
        doc.save(`Payment_Receipt_${payment.payment_id}.pdf`);
    };

    return (
        <AppLayout>
            <Head title="Payments" />
            
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-xl">
                                    <Banknote className="h-8 w-8 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payments</h1>
                                    <p className="text-gray-600 dark:text-gray-300 mt-1">Manage borrower payments and collections</p>
                                </div>
                            </div>
                            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Record Payment
                                    </Button>
                                </DialogTrigger>
                            </Dialog>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
                        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-blue-100 text-sm font-medium">Total Payments</p>
                                        <p className="text-3xl font-bold">{statistics.totalPayments}</p>
                                    </div>
                                    <Receipt className="h-8 w-8 text-blue-200" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-green-100 text-sm font-medium">Total Amount</p>
                                        <p className="text-2xl font-bold">{formatCurrency(statistics.totalAmount)}</p>
                                    </div>
                                    <DollarSign className="h-8 w-8 text-green-200" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-purple-100 text-sm font-medium">Monthly Collection</p>
                                        <p className="text-2xl font-bold">{formatCurrency(statistics.monthlyCollection)}</p>
                                    </div>
                                    <TrendingUp className="h-8 w-8 text-purple-200" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 shadow-lg">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-emerald-100 text-sm font-medium">Completed</p>
                                        <p className="text-3xl font-bold">{statistics.completedPayments}</p>
                                    </div>
                                    <CheckCircle className="h-8 w-8 text-emerald-200" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-lg">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-orange-100 text-sm font-medium">Pending</p>
                                        <p className="text-3xl font-bold">{statistics.pendingPayments}</p>
                                    </div>
                                    <Clock className="h-8 w-8 text-orange-200" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Search and Filter Bar */}
                    <Card className="mb-6 shadow-sm border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <CardContent className="p-6">
                            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                                    <div className="relative flex-1 max-w-md">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                        <Input
                                            type="text"
                                            placeholder="Search payments..."
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
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="failed">Failed</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                                        <SelectTrigger className="w-full sm:w-48 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                                            <Filter className="h-4 w-4 mr-2" />
                                            <SelectValue placeholder="Filter by type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Types</SelectItem>
                                            <SelectItem value="regular">Regular</SelectItem>
                                            <SelectItem value="partial">Partial</SelectItem>
                                            <SelectItem value="full">Full Payment</SelectItem>
                                            <SelectItem value="penalty">Penalty</SelectItem>
                                            <SelectItem value="advance">Advance</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant={viewMode === 'list' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setViewMode('list')}
                                        className="p-2"
                                    >
                                        <List className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant={viewMode === 'grid' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setViewMode('grid')}
                                        className="p-2"
                                    >
                                        <Grid3X3 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payments List */}
                    {filteredPayments.length > 0 ? (
                        <Card className="shadow-sm border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Payment Details
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Borrower & Loan
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Amount
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Type & Method
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
                                            {filteredPayments.map((payment) => (
                                                <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {payment.payment_id}
                                                            </div>
                                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                {new Date(payment.payment_date).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {payment.loan.borrower.first_name} {payment.loan.borrower.last_name}
                                                            </div>
                                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                {payment.loan.loan_id}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {formatCurrency(payment.amount)}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            Balance: {formatCurrency(payment.remaining_balance)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="space-y-1">
                                                            {getPaymentTypeBadge(payment.payment_type)}
                                                            <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                                                {payment.payment_method.replace('_', ' ')}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {getStatusBadge(payment.status)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex items-center space-x-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleViewPayment(payment)}
                                                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                                                title="View Payment Details"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => downloadReceipt(payment)}
                                                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                                                title="Download Receipt"
                                                            >
                                                                <Download className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="shadow-sm border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <CardContent className="p-12 text-center">
                                <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No payments found</h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-6">
                                    {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                                        ? 'Try adjusting your search or filter criteria.' 
                                        : 'Get started by recording your first payment.'}
                                </p>
                                {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
                                    <Button 
                                        onClick={() => setIsAddModalOpen(true)}
                                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Record First Payment
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Add Payment Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">Record Payment</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label htmlFor="loan_id" className="text-sm font-medium text-gray-700 dark:text-gray-300">Loan</Label>
                                <Select value={data.loan_id} onValueChange={(value) => setData('loan_id', value)}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select a loan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {activeLoans.map((loan) => (
                                            <SelectItem key={loan.id} value={loan.id.toString()}>
                                                {loan.loan_id} - {loan.borrower.first_name} {loan.borrower.last_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.loan_id} />
                            </div>

                            <div>
                                <Label htmlFor="amount" className="text-sm font-medium text-gray-700 dark:text-gray-300">Amount</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    value={data.amount}
                                    onChange={(e) => setData('amount', e.target.value)}
                                    className="mt-1"
                                    required
                                />
                                <InputError message={errors.amount} />
                            </div>

                            <div>
                                <Label htmlFor="payment_date" className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment Date</Label>
                                <Input
                                    id="payment_date"
                                    type="date"
                                    value={data.payment_date}
                                    onChange={(e) => setData('payment_date', e.target.value)}
                                    className="mt-1"
                                    required
                                />
                                <InputError message={errors.payment_date} />
                            </div>

                            <div>
                                <Label htmlFor="payment_type" className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment Type</Label>
                                <Select value={data.payment_type} onValueChange={(value) => setData('payment_type', value)}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="regular">Regular</SelectItem>
                                        <SelectItem value="partial">Partial</SelectItem>
                                        <SelectItem value="full">Full Payment</SelectItem>
                                        <SelectItem value="penalty">Penalty</SelectItem>
                                        <SelectItem value="advance">Advance</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.payment_type} />
                            </div>

                            <div>
                                <Label htmlFor="payment_method" className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment Method</Label>
                                <Select value={data.payment_method} onValueChange={(value) => setData('payment_method', value)}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                        <SelectItem value="check">Check</SelectItem>
                                        <SelectItem value="online">Online</SelectItem>
                                        <SelectItem value="gcash">GCash</SelectItem>
                                        <SelectItem value="paymaya">PayMaya</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.payment_method} />
                            </div>

                            <div>
                                <Label htmlFor="reference_number" className="text-sm font-medium text-gray-700 dark:text-gray-300">Reference Number</Label>
                                <Input
                                    id="reference_number"
                                    type="text"
                                    value={data.reference_number}
                                    onChange={(e) => setData('reference_number', e.target.value)}
                                    className="mt-1"
                                    placeholder="Optional"
                                />
                                <InputError message={errors.reference_number} />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="notes" className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes</Label>
                            <Textarea
                                id="notes"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                className="mt-1"
                                rows={3}
                                placeholder="Optional notes about this payment"
                            />
                            <InputError message={errors.notes} />
                        </div>

                        <div className="flex justify-end space-x-3 pt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsAddModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                            >
                                {processing ? 'Recording...' : 'Record Payment'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* View Payment Modal */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">Payment Details</DialogTitle>
                    </DialogHeader>
                    {selectedPayment && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment ID</Label>
                                    <p className="text-lg font-medium text-gray-900 dark:text-white">{selectedPayment.payment_id}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Amount</Label>
                                    <p className="text-lg font-medium text-gray-900 dark:text-white">{formatCurrency(selectedPayment.amount)}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Date</Label>
                                    <p className="text-lg font-medium text-gray-900 dark:text-white">
                                        {new Date(selectedPayment.payment_date).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</Label>
                                    <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</Label>
                                    <div className="mt-1">{getPaymentTypeBadge(selectedPayment.payment_type)}</div>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Method</Label>
                                    <p className="text-lg font-medium text-gray-900 dark:text-white capitalize">
                                        {selectedPayment.payment_method.replace('_', ' ')}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="border-t pt-6">
                                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Payment Breakdown</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Principal</Label>
                                        <p className="text-lg font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(selectedPayment.principal_amount)}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Interest</Label>
                                        <p className="text-lg font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(selectedPayment.interest_amount)}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Remaining Balance</Label>
                                        <p className="text-lg font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(selectedPayment.remaining_balance)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {selectedPayment.reference_number && (
                                <div>
                                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Reference Number</Label>
                                    <p className="text-lg font-medium text-gray-900 dark:text-white">{selectedPayment.reference_number}</p>
                                </div>
                            )}

                            {selectedPayment.notes && (
                                <div>
                                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Notes</Label>
                                    <p className="text-gray-900 dark:text-white">{selectedPayment.notes}</p>
                                </div>
                            )}

                            {selectedPayment.processed_by && (
                                <div className="border-t pt-4">
                                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Processed By</Label>
                                    <p className="text-gray-900 dark:text-white">
                                        {selectedPayment.processed_by.name} on {' '}
                                        {selectedPayment.processed_at && new Date(selectedPayment.processed_at).toLocaleString()}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}