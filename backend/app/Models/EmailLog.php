<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmailLog extends Model
{
    protected $fillable = [
        'template_id',
        'event_type',
        'recipient_email',
        'recipient_name',
        'subject',
        'body_html',
        'status',
        'error_message',
        'variables_used',
        'related_model_type',
        'related_model_id',
        'sent_at',
    ];

    protected $casts = [
        'variables_used' => 'array',
        'sent_at' => 'datetime',
    ];

    public function template(): BelongsTo
    {
        return $this->belongsTo(EmailTemplate::class, 'template_id');
    }
}
