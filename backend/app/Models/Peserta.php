<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\HasilUjian; // <--- ADD THIS

class Peserta extends Model
{
    protected $table = 'peserta';

    protected $fillable = [
        'nama',
        'nohp',
        'email',
        'password',
    ];

    public function hasilUjian()
    {
        return $this->hasMany(HasilUjian::class);
    }
}