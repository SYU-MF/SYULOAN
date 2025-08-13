<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Requirement extends Model
{
    use HasFactory;

    protected $fillable = [
        'borrower_id',
        'document_type',
        'file_name',
        'file_path',
        'file_size',
        'mime_type',
        'notes',
    ];

    // Document type constants
    const DOCUMENT_TYPES = [
        'government_id' => 'Valid Government-issued ID',
        'proof_of_billing' => 'Proof of Billing',
        'proof_of_income' => 'Proof of Income',
        'id_picture' => '1x1 or 2x2 ID Picture',
    ];

    /**
     * Get the borrower that owns the requirement.
     */
    public function borrower(): BelongsTo
    {
        return $this->belongsTo(Borrower::class);
    }

    /**
     * Get the human-readable document type.
     */
    public function getDocumentTypeTextAttribute(): string
    {
        return self::DOCUMENT_TYPES[$this->document_type] ?? $this->document_type;
    }

    /**
     * Get the file size in human-readable format.
     */
    public function getFileSizeFormattedAttribute(): string
    {
        $bytes = (int) $this->file_size;
        $units = ['B', 'KB', 'MB', 'GB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }
}