<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notice extends Model
{
    protected $fillable = ['text', 'sort_order', 'is_active', 'scroll_speed'];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_active' => 'boolean',
            'scroll_speed' => 'integer',
        ];
    }
}
