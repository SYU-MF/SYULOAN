<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoanPenalty extends Model
{
    protected $fillable = [
        'loan_id',
        'penalty_type',
        'penalty_rate',
        'grace_period_days',
        'penalty_calculation_base',
        'penalty_name',
        'description',
    ];

    protected $casts = [
        'penalty_rate' => 'decimal:2',
        'grace_period_days' => 'integer',
    ];

    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class);
    }
}