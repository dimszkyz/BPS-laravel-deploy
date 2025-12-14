<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. App Settings (Key-Value Store)
        Schema::create('app_settings', function (Blueprint $table) {
            $table->string('setting_key')->primary(); // Primary Key berupa string
            $table->text('setting_value')->nullable();
        });

        // 2. SMTP Settings (Untuk Email)
        Schema::create('smtp_settings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable()->index(); 
            
            $table->string('service')->default('gmail');
            $table->string('host');
            $table->integer('port')->default(587);
            $table->boolean('secure')->default(false);
            $table->string('auth_user');
            $table->string('auth_pass');
            $table->string('from_name')->default('Admin Ujian');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('smtp_settings');
        Schema::dropIfExists('app_settings');
    }
};