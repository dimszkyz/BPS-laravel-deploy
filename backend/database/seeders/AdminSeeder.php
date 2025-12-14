<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Admin;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        Admin::create([
            'username' => 'superadmin',
            'email' => 'admin@bps.com', // Sesuaikan dengan email login yang biasa Anda pakai
            'password' => Hash::make('password123'), // Password default
            'role' => 'superadmin',
            'is_active' => true,
        ]);
    }
}