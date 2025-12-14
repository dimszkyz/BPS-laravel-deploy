<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tabel Hasil Ujian (Sesuai routes/hasil.js)
        Schema::create('hasil_ujian', function (Blueprint $table) {
            $table->id();
            $table->foreignId('peserta_id')->constrained('peserta')->onDelete('cascade');
            $table->foreignId('exam_id')->constrained('exams')->onDelete('cascade');
            $table->foreignId('question_id')->constrained('questions')->onDelete('cascade');
            
            // Menyimpan jawaban text atau JSON string (untuk file path)
            $table->text('jawaban_text')->nullable(); 
            
            // Status benar/salah (default salah sampai dinilai)
            $table->boolean('benar')->default(false); 
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hasil_ujian');
    }
};