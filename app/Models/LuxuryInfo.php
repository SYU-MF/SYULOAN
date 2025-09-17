<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LuxuryInfo extends Model
{
    protected $table = 'luxury_information';

    protected $fillable = [
        'loan_id',
        'item_type',
        'brand',
        'model_collection_name',
        'material',
        'serial_number',
        'certificate_number',
        'year_purchased',
        'year_released',
        'proof_of_authenticity',
        'receipt_upload',
    ];

    protected $casts = [
        'year_purchased' => 'integer',
        'year_released' => 'integer',
    ];

    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class);
    }
}
