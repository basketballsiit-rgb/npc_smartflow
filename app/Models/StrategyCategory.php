<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StrategyCategory extends Model
{
    protected $fillable = ['name', 'code', 'description', 'is_active', 'order_index'];

    protected $casts = [
        'is_active' => 'boolean',
        'order_index' => 'integer',
    ];

    public function items()
    {
        return $this->hasMany(StrategyItem::class, 'strategy_category_id')->orderBy('order_index', 'asc')->orderBy('id', 'asc');
    }
}
