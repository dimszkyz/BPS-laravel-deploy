<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invitations', function (Blueprint $table) {
            $table->id();
            $table->string('email');
            $table->foreignId('exam_id')->constrained('exams')->onDelete('cascade');
            $table->string('login_code');
            $table->integer('max_logins')->default(1);
            $table->integer('login_count')->default(0);
            $table->unsignedBigInteger('admin_id'); // Pemilik ujian
            $table->timestamp('sent_at')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invitations');
    }
};