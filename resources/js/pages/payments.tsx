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

// Calculate remaining balance for a loan
const calculateRemainingBalance = (loan: Loan, payments: Payment[]): number => {
    const totalPaid = payments
        .filter(payment => payment.loan.id === loan.id && payment.status === 'completed')
        .reduce((sum, payment) => {
            const amount = Number(payment.amount) || 0;
            return sum + amount;
        }, 0);
    
    const loanTotal = Number(loan.total_amount) || 0;
    return Math.max(0, loanTotal - totalPaid);
};

// Calculate penalty for overdue loans
const calculatePenalty = (loan: Loan, payments: Payment[] = []): { penalty: number; daysOverdue: number; isOverdue: boolean } => {
    const loanReleaseDate = new Date(loan.loan_release_date);
    const currentDate = new Date();
    
    // If no penalties configured, return no penalty
    if (!loan.penalties || loan.penalties.length === 0) {
        return { penalty: 0, daysOverdue: 0, isOverdue: false };
    }
    
    // Filter completed payments for this loan
    const completedPayments = payments.filter(payment => 
        payment.loan.id === loan.id && payment.status === 'completed'
    );
    
    // Calculate the current due date based on completed payments
    // First payment is one month after release, then advance by number of completed payments
    const currentDueDate = new Date(loanReleaseDate);
    currentDueDate.setMonth(loanReleaseDate.getMonth() + 1 + completedPayments.length);
    
    // If the current payment hasn't come due yet, no penalty
    if (currentDate < currentDueDate) {
        return { penalty: 0, daysOverdue: 0, isOverdue: false };
    }
    
    let totalPenalty = 0;
    let maxDaysOverdue = 0;
    let isOverdue = false;
    
    // Calculate penalty for each penalty configuration
    for (const penaltyConfig of loan.penalties) {
        // Skip if penalty type is 'none'
        if (penaltyConfig.penalty_type === 'none') {
            continue;
        }
        
        // Calculate days overdue (with configurable grace period)
        const gracePeriodDays = penaltyConfig.grace_period_days || 7;
        const graceEndDate = new Date(currentDueDate);
        graceEndDate.setDate(currentDueDate.getDate() + gracePeriodDays);
        
        const timeDiff = currentDate.getTime() - graceEndDate.getTime();
        const daysOverdue = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        
        if (daysOverdue <= 0) {
            continue; // No penalty if within grace period
        }
        
        isOverdue = true;
        maxDaysOverdue = Math.max(maxDaysOverdue, daysOverdue);
        
        // Calculate penalty based on configuration
        const monthsOverdue = Math.max(1, Math.ceil(daysOverdue / 30));
        let penalty = 0;
        
        if (penaltyConfig.penalty_type === 'fixed') {
            penalty = (penaltyConfig.penalty_rate || 0) * monthsOverdue;
        }
        
        totalPenalty += penalty;
    }
    
    return { penalty: totalPenalty, daysOverdue: maxDaysOverdue, isOverdue };
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
    Download,
    RefreshCw
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

interface LoanPenalty {
    id: number;
    loan_id: number;
    penalty_type: string;
    penalty_rate: number;
    grace_period_days: number;
    penalty_calculation_base: string;
    penalty_name: string;
    description?: string;
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
    penalties?: LoanPenalty[];
    payments?: Payment[];
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
        penalty: { label: 'Regular with Penalty', variant: 'destructive' as const },
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
    const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
    const [penaltyInfo, setPenaltyInfo] = useState<{ penalty: number; daysOverdue: number; isOverdue: boolean } | null>(null);

    // Function to generate reference number
    const generateReferenceNumber = () => {
        const timestamp = Date.now().toString();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `REF-${timestamp.slice(-8)}-${random}`;
    };

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

    const handleCloseModal = () => {
        reset();
        setIsAddModalOpen(false);
        setSelectedLoan(null);
        setPenaltyInfo(null);
    };

    const handleLoanSelection = (loanId: string) => {
        setData('loan_id', loanId);
        const loan = activeLoans.find(l => l.id.toString() === loanId);
        if (loan) {
            setSelectedLoan(loan);
            const penalty = calculatePenalty(loan, payments);
            setPenaltyInfo(penalty);
            
            // Calculate remaining balance for this loan
            const remainingBalance = calculateRemainingBalance(loan, payments);
            const monthlyPayment = Number(loan.monthly_payment) || 0;
            const penaltyAmount = penalty.isOverdue ? (Number(penalty.penalty) || 0) : 0;
            
            let totalPaymentDue = 0;
            
            // Check if remaining balance is less than monthly payment (final payment)
            if (remainingBalance <= monthlyPayment) {
                // For final payment: use remaining balance + penalty (if overdue)
                totalPaymentDue = remainingBalance + penaltyAmount;
            } else {
                // For regular payment: use monthly payment + penalty (if overdue)
                totalPaymentDue = monthlyPayment + penaltyAmount;
            }
            
            setData('amount', totalPaymentDue.toString());
        } else {
            setSelectedLoan(null);
            setPenaltyInfo(null);
            setData('amount', '');
        }
    };

    const handleViewPayment = (payment: Payment) => {
        setSelectedPayment(payment);
        setIsViewModalOpen(true);
    };

    const handleOpenAddModal = () => {
        const newRefNumber = generateReferenceNumber();
        setData('reference_number', newRefNumber);
        setIsAddModalOpen(true);
    };

    const downloadReceipt = async (payment: Payment) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // Function to load logo image
        const loadLogo = (): Promise<string | null> => {
            return new Promise((resolve) => {
                const logoImg = new Image();
                logoImg.crossOrigin = 'anonymous';
                logoImg.onload = function() {
                    try {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        if (!ctx) {
                            resolve(null);
                            return;
                        }
                        canvas.width = logoImg.width;
                        canvas.height = logoImg.height;
                        ctx.drawImage(logoImg, 0, 0);
                        const logoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                        resolve(logoDataUrl);
                    } catch (e) {
                        console.log('Error processing logo:', e);
                        resolve(null);
                    }
                };
                logoImg.onerror = () => {
                    console.log('Logo failed to load');
                    resolve(null);
                };
                logoImg.src = '/img/logo.jpg';
                
                // Timeout after 3 seconds
                setTimeout(() => {
                    resolve(null);
                }, 3000);
            });
        };
        
        // Load logo
        const logoDataUrl = await loadLogo();
        
        // Modern black and gold color palette
        const primaryColor = [0, 0, 0]; // Black
        const accentColor = [255, 215, 0]; // Gold
        const darkGray = [31, 41, 55]; // Dark gray
        const lightGray = [249, 250, 251]; // Very light gray
        const borderColor = [229, 231, 235]; // Light border
        
        // Header with black and gold gradient effect
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(0, 0, pageWidth, 50, 'F');
        
        // Add gold accent stripe
        doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.rect(0, 45, pageWidth, 5, 'F');
        
        // Add company logo
        if (logoDataUrl) {
            try {
                // Add the actual logo image
                doc.addImage(logoDataUrl, 'JPEG', 15, 15, 20, 20);
            } catch (e) {
                console.log('Error adding logo to PDF:', e);
                // Fallback to styled placeholder
                doc.setFillColor(255, 255, 255);
                doc.circle(25, 25, 12, 'F');
                doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
                doc.setLineWidth(2);
                doc.circle(25, 25, 12, 'S');
                doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
                doc.setFontSize(6);
                doc.setFont('helvetica', 'bold');
                doc.text('SYU', 25, 27, { align: 'center' });
            }
        } else {
            // Enhanced fallback design when logo couldn't be loaded
            doc.setFillColor(255, 255, 255);
            doc.circle(25, 25, 12, 'F');
            doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
            doc.setLineWidth(2);
            doc.circle(25, 25, 12, 'S');
            doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
            doc.setFontSize(6);
            doc.setFont('helvetica', 'bold');
            doc.text('SYU', 25, 27, { align: 'center' });
        }
        
        // Company name and tagline
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.text('SYU LOAN', 45, 25);
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text('Financial Services & Lending Solutions', 45, 33);
        
        // Receipt title and info (Top Right)
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('PAYMENT RECEIPT', pageWidth - 20, 20, { align: 'right' });
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Receipt #: ${payment.payment_id}`, pageWidth - 20, 28, { align: 'right' });
        doc.text(`Date: ${new Date(payment.payment_date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })}`, pageWidth - 20, 35, { align: 'right' });
        
        // Status badge with gold background
        const statusText = payment.status.toUpperCase();
        doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.roundedRect(pageWidth - 60, 38, 40, 8, 2, 2, 'F');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(statusText, pageWidth - 40, 43, { align: 'center' });
        
        // Reset text color for body
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        
        // Borrower Information Section
        let yPos = 65;
        
        // Section header with modern styling
        doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
        doc.roundedRect(20, yPos, pageWidth - 40, 30, 3, 3, 'F');
        
        // Add subtle border
        doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        doc.setLineWidth(0.5);
        doc.roundedRect(20, yPos, pageWidth - 40, 30, 3, 3, 'S');
        
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('BORROWER INFORMATION', 25, yPos + 10);
        
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        const borrowerName = `${payment.loan.borrower.first_name} ${payment.loan.borrower.middle_name ? payment.loan.borrower.middle_name + ' ' : ''}${payment.loan.borrower.last_name}`;
        doc.text(`Name: ${borrowerName}`, 25, yPos + 18);
        doc.text(`Borrower ID: ${payment.loan.borrower.borrower_id}`, 25, yPos + 24);
        doc.text(`Email: ${payment.loan.borrower.email}`, pageWidth / 2 + 10, yPos + 18);
        doc.text(`Phone: ${payment.loan.borrower.phone}`, pageWidth / 2 + 10, yPos + 24);
        
        // Loan Information Section
        yPos += 40;
        doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
        doc.roundedRect(20, yPos, pageWidth - 40, 30, 3, 3, 'F');
        
        // Add subtle border
        doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        doc.roundedRect(20, yPos, pageWidth - 40, 30, 3, 3, 'S');
        
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('LOAN INFORMATION', 25, yPos + 10);
        
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        doc.text(`Loan ID: ${payment.loan.loan_id}`, 25, yPos + 18);
        doc.text(`Principal: ${formatCurrency(payment.loan.principal_amount)}`, 25, yPos + 24);
        doc.text(`Interest Rate: ${payment.loan.interest_rate}%`, pageWidth / 2 + 10, yPos + 18);
        doc.text(`Duration: ${payment.loan.loan_duration} months`, pageWidth / 2 + 10, yPos + 24);
        
        // Payment Details Section
        yPos += 50;
        doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
        doc.roundedRect(20, yPos, pageWidth - 40, 30, 3, 3, 'F');
        
        // Add subtle border
        doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        doc.setLineWidth(0.5);
        doc.roundedRect(20, yPos, pageWidth - 40, 30, 3, 3, 'S');
        
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('PAYMENT DETAILS', 25, yPos + 10);
        
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        doc.text(`Payment Date: ${new Date(payment.payment_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 25, yPos + 18);
        doc.text(`Payment Type: ${payment.payment_type.charAt(0).toUpperCase() + payment.payment_type.slice(1)}`, 25, yPos + 24);
        doc.text(`Payment Method: ${payment.payment_method.replace('_', ' ').toUpperCase()}`, pageWidth / 2 + 10, yPos + 18);
        if (payment.reference_number) {
            doc.text(`Reference: ${payment.reference_number}`, pageWidth / 2 + 10, yPos + 24);
        }
        
        // Payment breakdown table with modern styling
        yPos += 45;
        const tableData = [
            ['Principal Amount:', formatCurrency(payment.principal_amount)],
            ['Interest Amount:', formatCurrency(payment.interest_amount)],
            ['Penalty Amount:', formatCurrency(payment.penalty_amount)],
            ['Remaining Balance:', formatCurrency(payment.remaining_balance)]
        ];
        
        // Create alternating row colors for better readability
        tableData.forEach(([label, value], index) => {
            if (index % 2 === 0) {
                doc.setFillColor(248, 250, 252); // Very light gray
                doc.rect(20, yPos - 3, pageWidth - 40, 10, 'F');
            }
            
            doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
            doc.setFont('helvetica', 'normal');
            doc.text(label, 25, yPos + 2);
            doc.setFont('helvetica', 'bold');
            doc.text(value, pageWidth - 25, yPos + 2, { align: 'right' });
            yPos += 10;
        });
        
        // Total Amount Highlight with black and gold styling
         yPos += 10;
         
         // Black background with gold border
         doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
         doc.roundedRect(20, yPos, pageWidth - 40, 20, 5, 5, 'F');
         
         // Gold border
         doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
         doc.setLineWidth(2);
         doc.roundedRect(20, yPos, pageWidth - 40, 20, 5, 5, 'S');
         
         doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
         doc.setFontSize(16);
         doc.setFont('helvetica', 'bold');
         doc.text('TOTAL PAID:', 25, yPos + 12);
         doc.setFontSize(18);
         doc.text(formatCurrency(payment.amount), pageWidth - 25, yPos + 12, { align: 'right' });
        
        // Notes Section (if exists) with modern styling
        if (payment.notes) {
            yPos += 30;
            
            // Notes section background
            doc.setFillColor(252, 252, 253); // Very light background
            doc.roundedRect(20, yPos, pageWidth - 40, 25, 3, 3, 'F');
            
            // Add border
            doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
            doc.setLineWidth(0.5);
            doc.roundedRect(20, yPos, pageWidth - 40, 25, 3, 3, 'S');
            
            doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('NOTES:', 25, yPos + 8);
            
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            const splitNotes = doc.splitTextToSize(payment.notes, pageWidth - 50);
            doc.text(splitNotes, 25, yPos + 15);
            yPos += Math.max(25, splitNotes.length * 4 + 15);
        }
        
        // Modern Footer with enhanced styling
        const footerY = pageHeight - 40;
        
        // Footer background
        doc.setFillColor(249, 250, 251);
        doc.rect(0, footerY - 15, pageWidth, 55, 'F');
        
        // Decorative line with gold accent
         doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
         doc.setLineWidth(2);
         doc.line(20, footerY - 10, pageWidth - 20, footerY - 10);
        
        // Secondary line
        doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        doc.setLineWidth(0.5);
        doc.line(20, footerY - 8, pageWidth - 20, footerY - 8);
        
        // Footer text with better typography
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('SYU LOAN MANAGEMENT SYSTEM', pageWidth / 2, footerY, { align: 'center' });
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('This is an official payment receipt. Please keep this for your records.', pageWidth / 2, footerY + 6, { align: 'center' });
        
        doc.setTextColor(100, 116, 139); // Lighter gray
        doc.text(`Generated on: ${new Date().toLocaleString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        })}`, pageWidth / 2, footerY + 12, { align: 'center' });
        
        if (payment.processed_by) {
            doc.text(`Processed by: ${payment.processed_by.name}`, pageWidth / 2, footerY + 18, { align: 'center' });
        }
        
        // Add a subtle watermark
        doc.setTextColor(240, 240, 240);
        doc.setFontSize(60);
        doc.setFont('helvetica', 'bold');
        doc.text('PAID', pageWidth / 2, pageHeight / 2, { 
            align: 'center', 
            angle: -45,
            renderingMode: 'stroke'
        });
        
        // Save the PDF
        doc.save(`Payment_Receipt_${payment.payment_id}.pdf`);
    };

    return (
        <AppLayout>
            <Head title="Payments" />
            
            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payments</h1>
                        <p className="text-gray-600 dark:text-gray-300 mt-1">Manage borrower payments and collections</p>
                    </div>
                    <Button 
                        onClick={handleOpenAddModal}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Record Payment
                    </Button>
                </div>
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
                                            <SelectItem value="penalty">Regular with Penalty</SelectItem>
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
                                        onClick={handleOpenAddModal}
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

            {/* Add Payment Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={handleCloseModal}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">Record Payment</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <Label htmlFor="loan_id" className="text-sm font-medium text-gray-700 dark:text-gray-300">Loan</Label>
                                <Select value={data.loan_id} onValueChange={handleLoanSelection}>
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
                                
                                {/* Penalty Information Display */}
                                {selectedLoan && penaltyInfo && (
                                    <div className="mt-4 p-4 rounded-lg border">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Loan Information</h4>
                                            {penaltyInfo.isOverdue && (
                                                <Badge variant="destructive" className="flex items-center gap-1">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    Overdue
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-500 dark:text-gray-400">Monthly Payment:</span>
                                                <p className="font-medium">{formatCurrency(selectedLoan.monthly_payment)}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 dark:text-gray-400">Remaining Balance:</span>
                                                <p className="font-medium">{formatCurrency(calculateRemainingBalance(selectedLoan, payments))}</p>
                                            </div>
                                            {penaltyInfo.isOverdue && (
                                                <>
                                                    <div>
                                                        <span className="text-gray-500 dark:text-gray-400">Days Overdue:</span>
                                                        <p className="font-medium text-red-600">{penaltyInfo.daysOverdue} days</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 dark:text-gray-400">Penalty Amount:</span>
                                                        <p className="font-medium text-red-600">{formatCurrency(penaltyInfo.penalty)}</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        {penaltyInfo.isOverdue && (
                                            <div className="mt-4 space-y-3">
                                                {/* Payment Breakdown Table */}
                                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                                    <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Payment Breakdown</h5>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                                                            <span className="text-sm text-gray-600 dark:text-gray-400">Monthly Payment:</span>
                                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {formatCurrency(Number(selectedLoan.monthly_payment) || 0)}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                                                            <span className="text-sm text-gray-600 dark:text-gray-400">Penalty Amount:</span>
                                                            <span className="text-sm font-medium text-red-600 dark:text-red-400">
                                                                {formatCurrency(Number(penaltyInfo.penalty) || 0)}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-2 pt-3 border-t-2 border-blue-200 dark:border-blue-600">
                                                            <span className="text-base font-semibold text-blue-700 dark:text-blue-300">Total Payment Due:</span>
                                                            <span className="text-lg font-bold text-blue-800 dark:text-blue-200">
                                                                {formatCurrency((Number(selectedLoan.monthly_payment) || 0) + (Number(penaltyInfo.penalty) || 0))}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Penalty Details */}
                                                {selectedLoan.penalties && selectedLoan.penalties.length > 0 && (
                                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-700">
                                                        <h5 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-3 flex items-center gap-2">
                                                            <AlertTriangle className="h-4 w-4" />
                                                            Penalty Configuration Details
                                                        </h5>
                                                        <div className="space-y-2">
                                                            {selectedLoan.penalties.map((penalty, index) => (
                                                                <div key={index} className="text-xs text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-800/30 p-2 rounded">
                                                                    <div className="font-medium">{penalty.penalty_name || `Penalty ${index + 1}`}</div>
                                                                    <div className="mt-1 space-y-1">
                                                                        <div>Type: {penalty.penalty_type} (₱{penalty.penalty_rate})</div>
                                                                        <div>Grace Period: {penalty.grace_period_days} days</div>
                                                                        {penalty.description && <div>Note: {penalty.description}</div>}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {penaltyInfo.isOverdue && (
                                            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
                                                <p className="text-sm text-red-700 dark:text-red-300">
                                                    <strong>Note:</strong> This loan is overdue. A penalty of {formatCurrency(penaltyInfo.penalty)} will be automatically calculated for regular payments.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
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
                                <Select value={data.payment_type} onValueChange={(value) => {
                                    setData('payment_type', value);
                                    // Auto-calculate amount for regular payments
                                    if (value === 'regular' && selectedLoan) {
                                        const baseAmount = selectedLoan.monthly_payment;
                                        const penaltyAmount = penaltyInfo?.isOverdue ? penaltyInfo.penalty : 0;
                                        setData('amount', (baseAmount + penaltyAmount).toString());
                                    }
                                }}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="regular">Regular</SelectItem>
                                        <SelectItem value="partial">Partial</SelectItem>
                                        <SelectItem value="full">Full Payment</SelectItem>
                                        <SelectItem value="penalty">Regular with Penalty</SelectItem>
                                        <SelectItem value="advance">Advance</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.payment_type} />
                                {data.payment_type === 'regular' && penaltyInfo?.isOverdue && (
                                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                        Amount includes penalty of {formatCurrency(penaltyInfo.penalty)}
                                    </p>
                                )}
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
                                <Label htmlFor="reference_number" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Reference Number
                                    <span className="text-xs text-green-600 dark:text-green-400 ml-2"></span>
                                </Label>
                                <div className="flex gap-2 mt-1">
                                    <Input
                                        id="reference_number"
                                        type="text"
                                        value={data.reference_number}
                                        onChange={(e) => setData('reference_number', e.target.value)}
                                        className="flex-1"
                                        placeholder="Auto-generated reference number"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setData('reference_number', generateReferenceNumber())}
                                        className="px-3"
                                        title="Generate new reference number"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                </div>
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
                                onClick={handleCloseModal}
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
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                                        <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Penalty</Label>
                                        <p className="text-lg font-medium text-red-600 dark:text-red-400">
                                            {formatCurrency(selectedPayment.penalty_amount)}
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