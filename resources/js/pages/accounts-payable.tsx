import React, { useState, useMemo } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import InputError from '@/components/input-error';
import { 
    Search, 
    Filter, 
    Plus, 
    FileText, 
    DollarSign, 
    Eye, 
    Edit, 
    Trash2,
    Calendar,
    AlertTriangle,
    CheckCircle,
    Clock,
    TrendingUp,
    Building,
    CreditCard,
    Receipt,
    Calculator
} from 'lucide-react';

interface AccountsPayable {
    id: number;
    payable_id: string;
    vendor_name: string;
    vendor_contact?: string;
    vendor_email?: string;
    invoice_number: string;
    invoice_date: string;
    due_date: string;
    amount: number;
    paid_amount: number;
    remaining_amount: number;
    payment_terms: number;
    description: string;
    category?: string;
    status: number;
    late_fee_rate: number;
    late_fee_amount: number;
    discount_rate: number;
    discount_amount: number;
    notes?: string;
    created_by: number;
    created_at: string;
    updated_at: string;
    creator: {
        id: number;
        name: string;
    };
    status_label: string;
    payment_terms_label: string;
    current_late_fee?: number;
    current_discount?: number;
    total_amount_due?: number;
    days_until_due?: number;
    overdue_days?: number;
    loan_id?: number;
    loan?: {
        id: number;
        loan_id: string;
        borrower: {
            id: number;
            first_name: string;
            last_name: string;
            email: string;
        };
    };
}

interface Summary {
    total_payables: number;
    total_paid: number;
    total_outstanding: number;
    overdue_count: number;
    due_soon_count: number;
}

interface Props {
    payables: {
        data: AccountsPayable[];
        links: any;
        meta: any;
    };
    summary: Summary;
    filters: {
        search?: string;
        status?: string;
        vendor?: string;
        overdue?: string;
    };
}

const STATUS_OPTIONS = [
    { value: '1', label: 'Pending' },
    { value: '2', label: 'Partial' },
    { value: '3', label: 'Paid' },
    { value: '4', label: 'Overdue' },
    { value: '5', label: 'Cancelled' },
];

const PAYMENT_TERMS_OPTIONS = [
    { value: '15', label: 'Net 15' },
    { value: '30', label: 'Net 30' },
    { value: '45', label: 'Net 45' },
    { value: '60', label: 'Net 60' },
    { value: '90', label: 'Net 90' },
];

const CATEGORY_OPTIONS = [
    'Office Supplies',
    'Utilities',
    'Rent',
    'Insurance',
    'Professional Services',
    'Marketing',
    'Equipment',
    'Software',
    'Travel',
    'Other'
];

export default function AccountsPayable({ payables, summary, filters }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [vendorFilter, setVendorFilter] = useState(filters.vendor || '');

    const [isGenerating, setIsGenerating] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingPayable, setEditingPayable] = useState<AccountsPayable | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentPayable, setPaymentPayable] = useState<AccountsPayable | null>(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewingPayable, setViewingPayable] = useState<AccountsPayable | null>(null);

    const { data, setData, put, processing, errors, reset } = useForm({
        notes: '',
    });

    const { data: paymentData, setData: setPaymentData, post: postPayment, processing: paymentProcessing, errors: paymentErrors, reset: resetPayment } = useForm({
        amount: '',
        notes: '',
    });

    const handleSearch = () => {
        router.get('/accounts-payable', {
            search: searchTerm,
            status: statusFilter === 'all' ? '' : statusFilter,
            vendor: vendorFilter,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setVendorFilter('');
        router.get('/accounts-payable', {}, {
            preserveState: true,
            replace: true,
        });
    };

    const handleGeneratePayables = async () => {
        setIsGenerating(true);
        try {
            await router.post('/accounts-payable/generate');
        } catch (error) {
            console.error('Error generating payables:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleEdit = (payable: AccountsPayable) => {
        setEditingPayable(payable);
        setData({
            notes: payable.notes || '',
        });
        setShowEditModal(true);
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPayable) return;
        
        put(`/accounts-payable/${editingPayable.id}`, {
            onSuccess: () => {
                setShowEditModal(false);
                setEditingPayable(null);
                reset();
            },
        });
    };

    const handleDelete = (payable: AccountsPayable) => {
        if (payable.loan_id) {
            alert('Cannot delete loan-based payables. These are automatically generated from loan data.');
            return;
        }
        if (confirm('Are you sure you want to delete this payable record?')) {
            router.delete(`/accounts-payable/${payable.id}`);
        }
    };

    const handleMakePayment = (payable: AccountsPayable) => {
        setPaymentPayable(payable);
        setPaymentData({
            amount: payable.remaining_amount.toString(),
            notes: '',
        });
        setShowPaymentModal(true);
    };

    const handleView = (payable: AccountsPayable) => {
        setViewingPayable(payable);
        setShowViewModal(true);
    };

    const submitPayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentPayable) return;
        
        postPayment(`/accounts-payable/${paymentPayable.id}/payment`, {
            onSuccess: () => {
                setShowPaymentModal(false);
                setPaymentPayable(null);
                resetPayment();
            },
        });
    };

    const getStatusBadge = (payable: AccountsPayable) => {
        const isOverdue = new Date(payable.due_date) < new Date() && payable.status !== 3;
        
        if (isOverdue) {
            return <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Overdue
            </Badge>;
        }
        
        switch (payable.status) {
            case 1:
                return <Badge variant="secondary" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Pending
                </Badge>;
            case 2:
                return <Badge variant="outline" className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Partial
                </Badge>;
            case 3:
                return <Badge variant="default" className="flex items-center gap-1 bg-green-600">
                    <CheckCircle className="h-3 w-3" />
                    Paid
                </Badge>;
            case 5:
                return <Badge variant="secondary">
                    Cancelled
                </Badge>;
            default:
                return <Badge variant="secondary">{payable.status_label}</Badge>;
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getDaysUntilDue = (dueDate: string) => {
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    return (
        <AppLayout>
            <Head title="Accounts Payable" />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Accounts Payable</h1>
                        <p className="text-muted-foreground">Manage borrower invoices and payments</p>
                    </div>
                    <Button onClick={handleGeneratePayables} disabled={isGenerating} className="flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        {isGenerating ? 'Generating...' : 'Generate Payables'}
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Payables</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(summary.total_payables)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.total_paid)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                            <DollarSign className="h-4 w-4 text-orange-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">{formatCurrency(summary.total_outstanding)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Disbursements</CardTitle>
                            <Clock className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{summary.overdue_count}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Completed Disbursements</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{summary.due_soon_count}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <div className="space-y-2">
                                <Label htmlFor="search">Search</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="search"
                                        placeholder="Search payables..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All statuses</SelectItem>
                                        {STATUS_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="vendor">Borrower</Label>
                        <Input
                            id="vendor"
                            placeholder="Filter by borrower..."
                            value={vendorFilter}
                            onChange={(e) => setVendorFilter(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button onClick={handleSearch} className="flex-1">
                                    Apply Filters
                                </Button>
                                <Button variant="outline" onClick={clearFilters}>
                                    Clear
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Payables Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Payables List</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-2">Payable ID</th>
                                        <th className="text-left p-2">Loan</th>
                                        <th className="text-left p-2">Borrower</th>
                                        <th className="text-left p-2">Invoice #</th>
                                        <th className="text-left p-2">Amount</th>
                                        <th className="text-left p-2">Due Date</th>
                                        <th className="text-left p-2">Status</th>
                                        <th className="text-left p-2">Remaining</th>
                                        <th className="text-left p-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payables.data.map((payable) => {
                                        const daysUntilDue = getDaysUntilDue(payable.due_date);
                                        const isOverdue = daysUntilDue < 0;
                                        const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 7;
                                        
                                        return (
                                            <tr key={payable.id} className={`border-b hover:bg-muted/50 ${
                                                isOverdue ? 'bg-red-50' : isDueSoon ? 'bg-yellow-50' : ''
                                            }`}>
                                                <td className="p-2 font-mono text-sm">{payable.payable_id}</td>
                                                <td className="p-2">
                                                    {payable.loan ? (
                                                        <div>
                                                            <div className="font-medium">{payable.loan.loan_id}</div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {payable.loan.borrower.first_name} {payable.loan.borrower.last_name}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </td>
                                                <td className="p-2">
                                                    <div>
                                                        <div className="font-medium">{payable.vendor_name}</div>
                                                        {payable.vendor_email && (
                                                            <div className="text-sm text-muted-foreground">{payable.vendor_email}</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-2 font-mono text-sm">{payable.invoice_number}</td>
                                                <td className="p-2 font-medium">{formatCurrency(payable.amount)}</td>
                                                <td className="p-2">
                                                    <div>
                                                        <div>{formatDate(payable.due_date)}</div>
                                                        <div className={`text-sm ${
                                                            isOverdue ? 'text-red-600' : 
                                                            isDueSoon ? 'text-yellow-600' : 
                                                            'text-muted-foreground'
                                                        }`}>
                                                            {isOverdue ? `${Math.abs(daysUntilDue)} days overdue` :
                                                             isDueSoon ? `${daysUntilDue} days left` :
                                                             `${daysUntilDue} days left`}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-2">{getStatusBadge(payable)}</td>
                                                <td className="p-2">
                                                    <div className="font-medium">{formatCurrency(payable.remaining_amount)}</div>
                                                    {payable.paid_amount > 0 && (
                                                        <div className="text-sm text-muted-foreground">
                                                            Paid: {formatCurrency(payable.paid_amount)}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-2">
                                                    <div className="flex gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleView(payable)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        {payable.status !== 3 && payable.status !== 5 && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleEdit(payable)}
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleMakePayment(payable)}
                                                                    className="text-green-600 hover:text-green-700"
                                                                >
                                                                    <CreditCard className="h-4 w-4" />
                                                                </Button>
                                                            </>
                                                        )}
                                                        {payable.paid_amount === 0 && !payable.loan_id && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDelete(payable)}
                                                                className="text-red-600 hover:text-red-700"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        
                        {payables.data.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                No payables found. Generate payables from loan data.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>



            {/* Edit Modal */}
            <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Payable</DialogTitle>
                    </DialogHeader>
                    {editingPayable && (
                        <div className="space-y-4">
                            {editingPayable.loan_id && (
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <h4 className="font-medium text-blue-900 mb-2">Loan-Based Payable</h4>
                                    <p className="text-sm text-blue-700">
                                        This payable is automatically generated from loan data. Only notes can be edited.
                                    </p>
                                    {editingPayable.loan && (
                                        <div className="mt-2 text-sm text-blue-700">
                                            <strong>Loan:</strong> {editingPayable.loan.loan_id} - {editingPayable.loan.borrower.first_name} {editingPayable.loan.borrower.last_name}
                                        </div>
                                    )}
                                </div>
                            )}
                            <form onSubmit={handleUpdate} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit_notes">Notes</Label>
                                    <Textarea
                                        id="edit_notes"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        placeholder="Add notes about this payable..."
                                    />
                                    <InputError message={errors.notes} />
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Updating...' : 'Update Notes'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Payment Modal */}
            <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Make Payment</DialogTitle>
                    </DialogHeader>
                    {paymentPayable && (
                        <div className="space-y-4">
                            <div className="bg-muted p-4 rounded-lg">
                                <h4 className="font-medium mb-2">Payment Details</h4>
                                <div className="grid gap-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Borrower:</span>
                                        <span className="font-medium">{paymentPayable.vendor_name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Invoice:</span>
                                        <span className="font-medium">{paymentPayable.invoice_number}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Total Amount:</span>
                                        <span className="font-medium">{formatCurrency(paymentPayable.amount)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Paid Amount:</span>
                                        <span className="font-medium">{formatCurrency(paymentPayable.paid_amount)}</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-2">
                                        <span>Remaining:</span>
                                        <span className="font-medium text-orange-600">{formatCurrency(paymentPayable.remaining_amount)}</span>
                                    </div>
                                </div>
                            </div>
                            <form onSubmit={submitPayment} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="payment_amount">Payment Amount *</Label>
                                    <Input
                                        id="payment_amount"
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        max={paymentPayable.remaining_amount}
                                        value={paymentData.amount}
                                        onChange={(e) => setPaymentData('amount', e.target.value)}
                                        required
                                    />
                                    <InputError message={paymentErrors.amount} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="payment_notes">Payment Notes</Label>
                                    <Textarea
                                        id="payment_notes"
                                        value={paymentData.notes}
                                        onChange={(e) => setPaymentData('notes', e.target.value)}
                                        placeholder="Optional payment notes..."
                                    />
                                    <InputError message={paymentErrors.notes} />
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <Button type="button" variant="outline" onClick={() => setShowPaymentModal(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={paymentProcessing}>
                                        {paymentProcessing ? 'Processing...' : 'Record Payment'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* View Payable Modal */}
            <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Payable Details</DialogTitle>
                    </DialogHeader>
                    {viewingPayable && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Invoice Number</label>
                                    <p className="text-sm">{viewingPayable.invoice_number}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Amount</label>
                                    <p className="text-sm font-semibold">{formatCurrency(viewingPayable.amount)}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Due Date</label>
                                    <p className="text-sm">{new Date(viewingPayable.due_date).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Status</label>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        viewingPayable.status === 3
                                            ? 'bg-green-100 text-green-800'
                                            : viewingPayable.status === 2
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {viewingPayable.status === 3 ? 'Paid' : viewingPayable.status === 2 ? 'Partial' : 'Pending'}
                                    </span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Category</label>
                                    <p className="text-sm">{viewingPayable.category}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Remaining Amount</label>
                                    <p className="text-sm font-semibold">{formatCurrency(viewingPayable.remaining_amount)}</p>
                                </div>
                            </div>
                            {viewingPayable.loan && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Loan</label>
                                    <p className="text-sm">{viewingPayable.loan.borrower.first_name} {viewingPayable.loan.borrower.last_name}</p>
                                </div>
                            )}
                            <div>
                                <label className="text-sm font-medium text-gray-500">Description</label>
                                <p className="text-sm">{viewingPayable.description}</p>
                            </div>
                            {viewingPayable.notes && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Notes</label>
                                    <p className="text-sm">{viewingPayable.notes}</p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

        </AppLayout>
    );
}