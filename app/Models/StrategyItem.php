<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StrategyItem extends Model
{
    protected $fillable = ['strategy_category_id', 'name', 'code', 'description', 'is_active', 'order_index'];

    protected $casts = [
        'is_active' => 'boolean',
        'order_index' => 'integer',
    ];

    public function category()
    {
        return $this->belongsTo(StrategyCategory::class, 'strategy_category_id');
    }
}
