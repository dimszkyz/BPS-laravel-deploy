<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Question extends Model
{
    use HasFactory;

    // Pastikan semua kolom ini ada di fillable
    protected $fillable = [
        'exam_id',
        'tipe_soal',
        'soal_text',
        'gambar',
        'file_config', // <--- Pastikan ini ada
        'bobot',
    ];

    // [PENTING] Tambahkan casts ini agar Array otomatis jadi JSON saat disimpan
    protected $casts = [
        'file_config' => 'array',
        'bobot' => 'integer',
    ];

    public function exam()
    {
        return $this->belongsTo(Exam::class);
    }

    public function options()
    {
        return $this->hasMany(Option::class);
    }
}