<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Footer extends Model
{
    protected $fillable = [
        'column_name',
        'title',
        'logo_url',
        'links',
        'social_links',
        'contact_info',
        'content',
        'copyright_text',
        'powered_by_text',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'links' => 'array',
            'social_links' => 'array',
            'contact_info' => 'array',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }
}
