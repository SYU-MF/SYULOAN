<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Loan extends Model
{
    use HasFactory;

    // Status constants
    const STATUS_PENDING = 1;
    const STATUS_APPROVED = 2;
    const STATUS_ACTIVE = 3;
    const STATUS_COMPLETED = 4;
    const STATUS_DEFAULTED = 5;

    protected $fillable = [
        'loan_id',
        'borrower_id',
        'principal_amount',
        'loan_duration',
        'duration_period',
        'loan_release_date',
        'interest_rate',
        'interest_method',
        'total_amount',
        'monthly_payment',
        'loan_type',
        'purpose',
        'collateral',
        'status',
        'due_date',
        'notes',
    ];

    protected $casts = [
        'loan_release_date' => 'date',
        'due_date' => 'date',
        'principal_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'monthly_payment' => 'decimal:2',
        'interest_rate' => 'decimal:2',
    ];

    /**
     * Get the borrower that owns the loan.
     */
    public function borrower(): BelongsTo
    {
        return $this->belongsTo(Borrower::class);
    }

    /**
     * Get the payments for the loan.
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Generate a unique loan ID.
     */
    public static function generateLoanId(): string
    {
        do {
            $loanId = 'LN' . date('Y') . str_pad(mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);
        } while (self::where('loan_id', $loanId)->exists());

        return $loanId;
    }

    /**
     * Calculate total amount based on principal and interest.
     */
    public function calculateTotalAmount(): float
    {
        $principal = (float) $this->principal_amount;
        $rate = (float) $this->interest_rate / 100;
        $duration = (int) $this->loan_duration;
        
        // Simple interest calculation
        $interest = $principal * $rate * ($duration / 12);
        return $principal + $interest;
    }

    /**
     * Calculate monthly payment.
     */
    public function calculateMonthlyPayment(): float
    {
        return (float) $this->total_amount / (int) $this->loan_duration;
    }

    // Status helper methods
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isApproved(): bool
    {
        return $this->status === self::STATUS_APPROVED;
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    public function isDefaulted(): bool
    {
        return $this->status === self::STATUS_DEFAULTED;
    }

    /**
     * Get status label.
     */
    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            self::STATUS_PENDING => 'Pending',
            self::STATUS_APPROVED => 'Approved',
            self::STATUS_ACTIVE => 'Active',
            self::STATUS_COMPLETED => 'Completed',
            self::STATUS_DEFAULTED => 'Defaulted',
            default => 'Unknown'
        };
    }
}
