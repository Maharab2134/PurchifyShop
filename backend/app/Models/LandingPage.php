<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LandingPage extends Model
{
    use HasUuids;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'title',
        'slug',
        'template',
        'template_id',
        'product_id',
        'hero_headline',
        'hero_text',
        'video_url',
        'primary_color',
        'thumbnail',
        'view_count',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'view_count' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function templateModel(): BelongsTo
    {
        return $this->belongsTo(LandingPageTemplate::class, 'template_id');
    }
}
