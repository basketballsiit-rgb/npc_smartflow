<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StandardItem extends Model
{
    use HasFactory;

    protected $table = 'standard_items';

    protected $fillable = [
        'name',
        'unit',
        'standard_price',
        'category',
        'usage_count',
    ];

    protected $casts = [
        'standard_price' => 'decimal:2',
        'usage_count' => 'integer',
    ];
}
