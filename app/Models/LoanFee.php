<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoanFee extends Model
{
    protected $fillable = [
        'loan_id',
        'fee_type',
        'calculate_fee_on',
        'fee_percentage',
        'fixed_amount',
    ];

    protected $casts = [
        'fee_percentage' => 'decimal:2',
        'fixed_amount' => 'decimal:2',
    ];

    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class);
    }
}
