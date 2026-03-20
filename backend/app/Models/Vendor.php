<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vendor extends Model
{
    use HasUuids;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'name',
        'email',
        'address',
        'whatsapp_number',
        'contact_name',
        'status',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'vendor_id');
    }
}
