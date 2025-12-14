<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invitation extends Model
{
    protected $fillable = [
        'email',
        'exam_id',
        'login_code',
        'max_logins',
        'login_count',
        'admin_id',
        'sent_at'
    ];

    public function exam()
    {
        return $this->belongsTo(Exam::class);
    }
}