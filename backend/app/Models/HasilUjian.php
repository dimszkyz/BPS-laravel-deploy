<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HasilUjian extends Model
{
    protected $table = 'hasil_ujian';

    protected $fillable = [
        'peserta_id',
        'exam_id',
        'question_id',
        'jawaban_text',
        'benar',
    ];

    protected $casts = [
        'benar' => 'boolean',
    ];

    // Relasi-relasi
    public function peserta()
    {
        return $this->belongsTo(Peserta::class);
    }

    public function exam()
    {
        return $this->belongsTo(Exam::class);
    }

    public function question()
    {
        return $this->belongsTo(Question::class);
    }
}