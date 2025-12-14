<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppSetting extends Model
{
    protected $table = 'app_settings';
    protected $primaryKey = 'setting_key'; // Primary key custom
    public $incrementing = false;          // Karena PK bukan auto-increment integer
    protected $keyType = 'string';         // Tipe data PK string
    public $timestamps = false;            // Tabel ini tidak butuh created_at/updated_at

    protected $fillable = ['setting_key', 'setting_value'];
}