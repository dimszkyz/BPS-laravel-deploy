<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PasswordResetRequest extends Model
{
    protected $table = 'password_reset_requests';
    
    // Update fillable agar field baru bisa disimpan
    protected $fillable = [
        'email', 
        'username', 
        'whatsapp', 
        'reason', 
        'status'
    ];
}