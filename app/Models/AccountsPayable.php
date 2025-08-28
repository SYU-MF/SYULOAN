<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class AccountsPayable extends Model
{
    use HasFactory;

    protected $table = 'accounts_payable';

    // Status constants
    const STATUS_PENDING = 1;
    const STATUS_PARTIAL = 2;
    const STATUS_PAID = 3;
    const STATUS_OVERDUE = 4;
    const STATUS_CANCELLED = 5;

    // Payment terms constants
    const TERMS_NET_15 = 15;
    const TERMS_NET_30 = 30;
    const TERMS_NET_45 = 45;
    const TERMS_NET_60 = 60;
    const TERMS_NET_90 = 90;

    protected $fillable = [
        'payable_id',
        'loan_id',
        'vendor_name',
        'vendor_contact',
        'vendor_email',
        'invoice_number',
        'invoice_date',
        'due_date',
        'amount',
        'paid_amount',
        'remaining_amount',
        'payment_terms',
        'description',
        'category',
        'status',
        'late_fee_rate',
        'late_fee_amount',
        'discount_rate',
        'discount_amount',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'invoice_date' => 'date',
        'due_date' => 'date',
        'amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'remaining_amount' => 'decimal:2',
        'late_fee_rate' => 'decimal:2',
        'late_fee_amount' => 'decimal:2',
        'discount_rate' => 'decimal:2',
        'discount_amount' => 'decimal:2',
    ];

    /**
     * Get the user who created this payable.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the loan associated with this payable.
     */
    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class);
    }

    /**
     * Generate a unique payable ID.
     */
    public static function generatePayableId(): string
    {
        do {
            $payableId = 'AP' . date('Y') . str_pad(mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);
        } while (self::where('payable_id', $payableId)->exists());

        return $payableId;
    }

    /**
     * Calculate remaining amount after payments.
     */
    public function calculateRemainingAmount(): float
    {
        $amount = (float) $this->amount;
        $paidAmount = (float) $this->paid_amount;
        $discountAmount = (float) $this->discount_amount;
        
        return max(0, $amount - $paidAmount - $discountAmount);
    }

    /**
     * Calculate late fee based on overdue days.
     */
    public function calculateLateFee(): float
    {
        if (!$this->isOverdue() || $this->late_fee_rate <= 0) {
            return 0;
        }

        $overdueDays = $this->getOverdueDays();
        $remainingAmount = $this->calculateRemainingAmount();
        $dailyRate = (float) $this->late_fee_rate / 100 / 365; // Convert annual rate to daily
        
        return round($remainingAmount * $dailyRate * $overdueDays, 2);
    }

    /**
     * Calculate early payment discount.
     */
    public function calculateEarlyPaymentDiscount(): float
    {
        if ($this->discount_rate <= 0 || $this->isOverdue()) {
            return 0;
        }

        $amount = (float) $this->amount;
        $discountRate = (float) $this->discount_rate / 100;
        
        return round($amount * $discountRate, 2);
    }

    /**
     * Get total amount including late fees.
     */
    public function getTotalAmountDue(): float
    {
        $remainingAmount = $this->calculateRemainingAmount();
        $lateFee = $this->calculateLateFee();
        
        return $remainingAmount + $lateFee;
    }

    /**
     * Get days until due date (negative if overdue).
     */
    public function getDaysUntilDue(): int
    {
        return Carbon::now()->diffInDays($this->due_date, false);
    }

    /**
     * Get overdue days.
     */
    public function getOverdueDays(): int
    {
        if (!$this->isOverdue()) {
            return 0;
        }
        
        return Carbon::now()->diffInDays($this->due_date);
    }

    /**
     * Check if payable is overdue.
     */
    public function isOverdue(): bool
    {
        return Carbon::now()->isAfter($this->due_date) && $this->status !== self::STATUS_PAID;
    }

    /**
     * Check if payable is due soon (within 7 days).
     */
    public function isDueSoon(): bool
    {
        $daysUntilDue = $this->getDaysUntilDue();
        return $daysUntilDue >= 0 && $daysUntilDue <= 7 && $this->status !== self::STATUS_PAID;
    }

    // Status helper methods
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isPartial(): bool
    {
        return $this->status === self::STATUS_PARTIAL;
    }

    public function isPaid(): bool
    {
        return $this->status === self::STATUS_PAID;
    }

    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    /**
     * Get status label.
     */
    public function getStatusLabelAttribute(): string
    {
        if ($this->isOverdue()) {
            return 'Overdue';
        }
        
        return match($this->status) {
            self::STATUS_PENDING => 'Pending',
            self::STATUS_PARTIAL => 'Partial',
            self::STATUS_PAID => 'Paid',
            self::STATUS_CANCELLED => 'Cancelled',
            default => 'Unknown'
        };
    }

    /**
     * Get payment terms label.
     */
    public function getPaymentTermsLabelAttribute(): string
    {
        return match($this->payment_terms) {
            self::TERMS_NET_15 => 'Net 15',
            self::TERMS_NET_30 => 'Net 30',
            self::TERMS_NET_45 => 'Net 45',
            self::TERMS_NET_60 => 'Net 60',
            self::TERMS_NET_90 => 'Net 90',
            default => 'Custom'
        };
    }

    /**
     * Update status based on payment amount.
     */
    public function updateStatus(): void
    {
        $remainingAmount = $this->calculateRemainingAmount();
        
        if ($remainingAmount <= 0) {
            $this->status = self::STATUS_PAID;
        } elseif ($this->paid_amount > 0) {
            $this->status = self::STATUS_PARTIAL;
        } else {
            $this->status = self::STATUS_PENDING;
        }
        
        $this->remaining_amount = $remainingAmount;
        $this->save();
    }

    /**
     * Make a payment.
     */
    public function makePayment(float $amount, string $notes = null): bool
    {
        if ($amount <= 0 || $amount > $this->calculateRemainingAmount()) {
            return false;
        }
        
        $this->paid_amount = (float) $this->paid_amount + $amount;
        $this->updateStatus();
        
        // You can add payment history tracking here if needed
        
        return true;
    }

    /**
     * Generate payables for all active loans based on released amount.
     */
    public static function generateLoanPayables(): void
    {
        $activeLoans = Loan::where('status', Loan::STATUS_ACTIVE)->get();
        
        foreach ($activeLoans as $loan) {
            // Check if payable already exists for this loan
            $existingPayable = self::where('loan_id', $loan->id)->first();
            
            if (!$existingPayable) {
                // Calculate due date (30 days from now)
                $dueDate = Carbon::now()->addDays(30);
                
                self::create([
                    'payable_id' => self::generatePayableId(),
                    'loan_id' => $loan->id,
                    'vendor_name' => $loan->borrower->first_name . ' ' . $loan->borrower->last_name,
                    'vendor_contact' => $loan->borrower->phone ?? '',
                    'vendor_email' => $loan->borrower->email ?? '',
                    'invoice_number' => 'LOAN-' . $loan->loan_id,
                    'invoice_date' => Carbon::now(),
                    'due_date' => $dueDate,
                    'amount' => $loan->released_amount,
                    'paid_amount' => 0,
                    'remaining_amount' => $loan->released_amount,
                    'payment_terms' => 30,
                    'description' => 'Loan disbursement payable for loan ' . $loan->loan_id,
                    'category' => 'Loan Disbursement',
                    'status' => self::STATUS_PENDING,
                    'late_fee_rate' => 5.0, // 5% annual late fee
                    'late_fee_amount' => 0,
                    'discount_rate' => 0,
                    'discount_amount' => 0,
                    'notes' => 'Auto-generated from loan ' . $loan->loan_id . ' - Amount to be disbursed to borrower',
                    'created_by' => 1, // System user
                ]);
            }
        }
    }

    /**
     * Get all loan-based payables with loan information.
     */
    public static function getLoanPayables()
    {
        return self::with(['loan.borrower', 'creator'])
            ->whereNotNull('loan_id')
            ->orderBy('due_date', 'asc');
    }
}