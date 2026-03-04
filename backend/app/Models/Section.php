<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Section extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'type',
        'title',
        'description',
        'images',
        'icons',
        'link',
        'cta_text',
        'is_visible',
        'primary_color',
        'secondary_color',
    ];

    protected function casts(): array
    {
        return [
            'images' => 'array',
            'is_visible' => 'boolean',
        ];
    }
}
