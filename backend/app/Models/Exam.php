<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Exam extends Model
{
    protected $fillable = [
        'keterangan',
        'tanggal',
        'tanggal_berakhir',
        'jam_mulai',
        'jam_berakhir',
        'acak_soal',
        'acak_opsi',
        'durasi',
        'admin_id',
        'is_deleted',
    ];

    protected $casts = [
        'acak_soal' => 'boolean',
        'acak_opsi' => 'boolean',
        'is_deleted' => 'boolean',
    ];

    // Relasi ke Admin
    public function admin()
    {
        return $this->belongsTo(Admin::class);
    }

    // Relasi ke Soal (Questions)
    public function questions()
    {
        return $this->hasMany(Question::class);
    }
}