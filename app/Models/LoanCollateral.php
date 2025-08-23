<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoanCollateral extends Model
{
    protected $fillable = [
        'loan_id',
        'name',
        'description',
        'defects',
        'file_paths',
    ];

    protected $casts = [
        'file_paths' => 'array',
    ];

    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class);
    }
}
