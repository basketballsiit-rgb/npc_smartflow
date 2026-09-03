<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vendor extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'tax_id',
        'bank_name',
        'bank_account_number',
        'bank_account_name',
        'address',
        'phone',
        'contact_person',
        'category',
    ];
}
