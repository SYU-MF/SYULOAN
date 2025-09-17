<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VehicleInfo extends Model
{
    protected $table = 'vehicle_information';

    protected $fillable = [
        'loan_id',
        'vehicle_type',
        'make',
        'model',
        'type',
        'year_of_manufacture',
        'color',
        'plate_number',
        'chassis_number',
        'engine_number',
    ];

    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class);
    }
}
