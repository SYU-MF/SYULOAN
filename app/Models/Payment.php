<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Payment extends Model
{
    // Payment types
    const TYPE_REGULAR = 'regular';
    const TYPE_PARTIAL = 'partial';
    const TYPE_FULL = 'full';
    const TYPE_PENALTY = 'penalty';
    const TYPE_ADVANCE = 'advance';

    // Payment methods
    const METHOD_CASH = 'cash';
    const METHOD_BANK_TRANSFER = 'bank_transfer';
    const METHOD_CHECK = 'check';
    const METHOD_ONLINE = 'online';
    const METHOD_GCASH = 'gcash';
    const METHOD_PAYMAYA = 'paymaya';

    // Payment statuses
    const STATUS_PENDING = 'pending';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';
    const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'payment_id',
        'loan_id',
        'amount',
        'payment_date',
        'payment_type',
        'payment_method',
        'status',
        'principal_amount',
        'interest_amount',
        'penalty_amount',
        'remaining_balance',
        'reference_number',
        'notes',
        'processed_by',
        'processed_at',
    ];

    protected $casts = [
        'payment_date' => 'date',
        'processed_at' => 'datetime',
        'amount' => 'decimal:2',
        'principal_amount' => 'decimal:2',
        'interest_amount' => 'decimal:2',
        'penalty_amount' => 'decimal:2',
        'remaining_balance' => 'decimal:2',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($payment) {
            if (empty($payment->payment_id)) {
                $payment->payment_id = 'PAY-' . strtoupper(Str::random(8));
            }
        });
    }

    // Relationships
    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class);
    }

    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    // Status helper methods
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    public function isFailed(): bool
    {
        return $this->status === self::STATUS_FAILED;
    }

    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    // Type helper methods
    public function isRegular(): bool
    {
        return $this->payment_type === self::TYPE_REGULAR;
    }

    public function isPartial(): bool
    {
        return $this->payment_type === self::TYPE_PARTIAL;
    }

    public function isFull(): bool
    {
        return $this->payment_type === self::TYPE_FULL;
    }
}
