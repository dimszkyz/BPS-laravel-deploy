<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SmtpSetting extends Model
{
    protected $table = 'smtp_settings';

    protected $fillable = [
        'user_id', // <--- Tambahkan ini
        'service',
        'host',
        'port',
        'secure',
        'auth_user',
        'auth_pass',
        'from_name',
    ];

    protected $casts = [
        'secure' => 'boolean',
    ];
}