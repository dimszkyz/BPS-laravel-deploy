<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\Peserta;
use App\Models\HasilUjian;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http; // Tambahan untuk Request ke Google
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Handle Admin Login
     */
    public function login(Request $request)
    {
        // 1. Validasi Input (Username/Email, Password, dan Captcha)
        $request->validate([
            'email' => 'required',
            'password' => 'required',
            'captcha' => 'required', // Wajib ada untuk keamanan
        ]);

        // 2. Verifikasi ReCAPTCHA ke Google
        $recaptchaSecret = env('RECAPTCHA_SECRET_KEY');
        
        // Hanya verifikasi jika key ada di .env (untuk dev mode bisa dikosongkan jika perlu bypass)
        if ($recaptchaSecret) {
            try {
                $response = Http::asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
                    'secret' => $recaptchaSecret,
                    'response' => $request->captcha,
                ]);

                if (!$response->json()['success']) {
                    return response()->json(['message' => 'Verifikasi captcha gagal.'], 403);
                }
            } catch (\Exception $e) {
                // Opsional: Log error jika gagal connect ke Google
                return response()->json(['message' => 'Gagal memverifikasi captcha (Network Error).'], 500);
            }
        }

        // 3. Cari Admin (Cek di kolom email ATAU username)
        $input = $request->email; 

        $admin = Admin::where(function($query) use ($input) {
                        $query->where('email', $input)
                              ->orWhere('username', $input);
                    })->first();

        // 4. Cek Password & Keberadaan User
        if (! $admin || ! Hash::check($request->password, $admin->password)) {
            return response()->json([
                'message' => 'Username/Email atau password salah.' 
            ], 401);
        }

        // 5. Cek Status Aktif
        if (!$admin->is_active) {
            return response()->json([
                'message' => 'Akun Anda telah dinonaktifkan.'
            ], 403);
        }

        // 6. Generate Token
        $token = $admin->createToken('admin-token')->plainTextToken;

        // 7. Kirim Response
        return response()->json([
            'message' => 'Login berhasil',
            'token' => $token,
            'admin' => [
                'id' => $admin->id,
                'username' => $admin->username,
                'email' => $admin->email,
                'role' => $admin->role,
            ]
        ]);
    }

    /**
     * Login Peserta (Berdasarkan Email & Kode Login)
     */
    public function loginPeserta(Request $request)
    {
        // 1. Validasi
        $request->validate([
            'email' => 'required|email',
            'login_code' => 'required',
        ]);

        // 2. Cari Peserta
        $peserta = Peserta::where('email', $request->email)->first();

        // 3. Cek Kecocokan Password / Kode Login
        // Menggunakan perbandingan langsung string (sesuai logika kode login)
        if (!$peserta || $peserta->password !== $request->login_code) {
             return response()->json(['message' => 'Email atau Kode Login salah.'], 401);
        }

        // 4. Cari Ujian Aktif untuk Peserta ini (mengambil ujian terakhir yang dikerjakan)
        $activeExamId = HasilUjian::where('peserta_id', $peserta->id)
                        ->latest('created_at')
                        ->value('exam_id'); 

        return response()->json([
            'message' => 'Login berhasil',
            'email' => $peserta->email,
            'examId' => $activeExamId ?? 0,
            'peserta' => $peserta
        ]);
    }

    /**
     * Get Current User Info
     */
    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    /**
     * Handle Logout
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logout berhasil']);
    }
}