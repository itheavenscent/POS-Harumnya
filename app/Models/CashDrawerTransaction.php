<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CashDrawerTransaction extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'cash_drawer_id',
        'type',
        'amount',
        'description',
        'user_id',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function cashDrawer()
    {
        return $this->belongsTo(CashDrawer::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
