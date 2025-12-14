<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Tabel Exams (Sesuai routes/ujian.js)
        Schema::create('exams', function (Blueprint $table) {
            $table->id();
            $table->text('keterangan'); // Judul/Nama Ujian
            $table->date('tanggal');
            $table->date('tanggal_berakhir');
            $table->time('jam_mulai');
            $table->time('jam_berakhir');
            $table->boolean('acak_soal')->default(false);
            $table->boolean('acak_opsi')->default(false);
            $table->integer('durasi'); // Dalam menit
            $table->unsignedBigInteger('admin_id'); // Pembuat soal
            $table->boolean('is_deleted')->default(false); // Soft delete logic
            $table->timestamps();

            // Relasi ke tabel admins (optional, jika admin dihapus ujian tetap ada atau ikut terhapus)
            $table->foreign('admin_id')->references('id')->on('admins');
        });

        // 2. Tabel Questions (Soal)
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained('exams')->onDelete('cascade');
            $table->string('tipe_soal'); // 'pilihanGanda', 'teksSingkat', 'esay', 'soalDokumen'
            $table->text('soal_text')->nullable();
            $table->string('gambar')->nullable(); // Path gambar
            $table->json('file_config')->nullable(); // Config untuk soalDokumen
            $table->integer('bobot')->default(1);
            $table->timestamps();
        });

        // 3. Tabel Options (Pilihan Jawaban / Kunci)
        Schema::create('options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained('questions')->onDelete('cascade');
            $table->text('opsi_text')->nullable();
            $table->boolean('is_correct')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('options');
        Schema::dropIfExists('questions');
        Schema::dropIfExists('exams');
    }
};