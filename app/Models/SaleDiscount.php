<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

class SaleDiscount extends Model
{
    use HasUuids;

    protected $guarded = [];
}
