<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Borrower extends Model
{
    use HasFactory;

    // Status constants
    const STATUS_PENDING = 1;
    const STATUS_CONFIRMED = 2;
    const STATUS_DECLINED = 3;

    protected $fillable = [
        'borrower_id',
        'first_name',
        'middle_name',
        'last_name',
        'gender',
        'nationality',
        'civil_status',
        'email',
        'phone',
        'address',
        'date_of_birth',
        'occupation',
        'monthly_income',
        'status',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'monthly_income' => 'decimal:2',
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($borrower) {
            if (empty($borrower->borrower_id)) {
                $borrower->borrower_id = 'B' . str_pad(
                    (static::max('id') ?? 0) + 1,
                    3,
                    '0',
                    STR_PAD_LEFT
                );
            }
        });
    }

    public function getFullNameAttribute()
    {
        return $this->first_name . ' ' . $this->last_name;
    }

    public function getStatusTextAttribute()
    {
        switch ($this->status) {
            case self::STATUS_PENDING:
                return 'Pending';
            case self::STATUS_CONFIRMED:
                return 'Confirmed';
            case self::STATUS_DECLINED:
                return 'Declined';
            default:
                return 'Unknown';
        }
    }

    public function isPending()
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isConfirmed()
    {
        return $this->status === self::STATUS_CONFIRMED;
    }

    public function isDeclined()
    {
        return $this->status === self::STATUS_DECLINED;
    }

    public function confirm()
    {
        $this->update(['status' => self::STATUS_CONFIRMED]);
    }

    public function decline()
    {
        $this->update(['status' => self::STATUS_DECLINED]);
    }

    /**
     * Get the requirements for the borrower.
     */
    public function requirements(): HasMany
    {
        return $this->hasMany(Requirement::class);
    }
}
