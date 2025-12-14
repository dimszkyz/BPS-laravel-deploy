<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Tabel Admins (Sesuai routes/adminList.js)
        Schema::create('admins', function (Blueprint $table) {
            $table->id();
            $table->string('username');
            $table->string('email')->unique();
            $table->string('password'); // Password admin
            $table->enum('role', ['superadmin', 'admin'])->default('admin');
            $table->boolean('is_active')->default(true);
            $table->timestamps(); // created_at & updated_at
        });

        // 2. Tabel Peserta (Sesuai routes/peserta.js)
        Schema::create('peserta', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->string('nohp');
            $table->string('email');
            // Menambahkan password nullable jika nanti dibutuhkan login khusus
            $table->string('password')->nullable(); 
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('peserta');
        Schema::dropIfExists('admins');
    }
};