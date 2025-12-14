<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Admin extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $table = 'admins'; // Menunjuk ke tabel admins

    protected $fillable = [
        'username',
        'email',
        'password',
        'role',
        'is_active',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'password' => 'hashed', // Otomatis hash password saat save
        'is_active' => 'boolean',
    ];

    // Relasi: Admin bisa punya banyak ujian
    public function exams()
    {
        return $this->hasMany(Exam::class);
    }
}