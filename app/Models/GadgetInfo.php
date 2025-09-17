<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GadgetInfo extends Model
{
    protected $table = 'gadget_information';

    protected $fillable = [
        'loan_id',
        'gadget_type',
        'brand',
        'model_series',
        'specifications',
        'serial_number',
        'imei',
        'color_variant',
        'year_purchased',
        'year_released',
        'warranty_details',
        'proof_of_purchase',
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
