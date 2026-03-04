<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    protected $fillable = ['slug', 'name', 'is_active', 'config', 'charge', 'sort_order'];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'config' => 'array',
            'charge' => 'decimal:2',
            'sort_order' => 'integer',
        ];
    }

    public function requiresSenderAndTxn(): bool
    {
        return in_array($this->slug, ['bkash', 'nagad', 'rocket'], true);
    }

    /** Bank / Jolhon: show sending account number, user only enters transaction ID */
    public function requiresTransactionIdOnly(): bool
    {
        return in_array($this->slug, ['jolhon', 'bank_transfer', 'bank_account'], true);
    }
}
