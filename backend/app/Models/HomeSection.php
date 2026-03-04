<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class HomeSection extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'theme_type',
        'title',
        'description',
        'subtitle',
        'theme_data',
        'background_color',
        'text_color',
        'cta_text',
        'cta_link',
        'is_visible',
        'sort_order',
        'countdown_end',
        'icon',
        'image',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'countdown_end' => 'datetime',
            'theme_data' => 'array',
            'is_visible' => 'boolean',
        ];
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'home_section_product')
            ->withPivot('sort_order')
            ->orderByPivot('sort_order')
            ->withTimestamps();
    }
}
