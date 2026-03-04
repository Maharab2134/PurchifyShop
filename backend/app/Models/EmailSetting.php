<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class EmailSetting extends Model
{
    protected $fillable = [
        'mailer',
        'host',
        'port',
        'username',
        'password',
        'encryption',
        'from_address',
        'from_name',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'port' => 'integer',
    ];

    // Encrypt password when setting
    public function setPasswordAttribute($value)
    {
        $this->attributes['password'] = $value ? Crypt::encryptString($value) : null;
    }

    // Decrypt password when getting
    public function getPasswordAttribute($value)
    {
        return $value ? Crypt::decryptString($value) : null;
    }

    // Get or create singleton instance
    public static function getSettings()
    {
        return static::firstOrCreate(
            ['id' => 1],
            [
                'mailer' => 'smtp',
                'from_address' => config('mail.from.address', 'noreply@example.com'),
                'from_name' => config('mail.from.name', 'Ecommerce'),
                'is_active' => false,
            ]
        );
    }
}
