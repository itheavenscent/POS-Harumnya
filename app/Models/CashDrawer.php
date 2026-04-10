<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CashDrawer extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'store_id',
        'cashier_id',
        'opened_at',
        'closed_at',
        'starting_cash',
        'expected_ending_cash',
        'actual_ending_cash',
        'difference',
        'total_cash_sales',
        'total_non_cash_sales',
        'status',
        'notes',
    ];

    protected $casts = [
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
        'starting_cash' => 'decimal:2',
        'expected_ending_cash' => 'decimal:2',
        'actual_ending_cash' => 'decimal:2',
        'difference' => 'decimal:2',
        'total_cash_sales' => 'decimal:2',
        'total_non_cash_sales' => 'decimal:2',
    ];

    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    public function cashier()
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }
}
