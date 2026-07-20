<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProcurementItem extends Model
{
    protected $table = 'procurement_items';

    protected $fillable = [
        'procurement_id',
        'description',
        'quantity',
        'unit',
        'unit_price',
        'total_price',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'unit_price' => 'decimal:2',
            'total_price' => 'decimal:2',
        ];
    }

    /**
     * Get the procurement process this item belongs to.
     */
    public function procurement()
    {
        return $this->belongsTo(Procurement::class);
    }
}
