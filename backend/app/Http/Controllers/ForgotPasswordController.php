<?php

namespace App\Http\Controllers;

use App\Models\PasswordResetRequest;
use App\Models\Admin;
use App\Models\SmtpSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class ForgotPasswordController extends Controller
{
    private function setupMailer($userId)
    {
        try {
            $smtp = SmtpSetting::where('user_id', $userId)->first(); 

            if (!$smtp || empty($smtp->auth_user) || empty($smtp->auth_pass) || empty($smtp->host)) {
                return false;
            }

            // [PERBAIKAN 1] Paksa Laravel menggunakan driver 'smtp' saat ini juga
            // Tanpa ini, Laravel mungkin masih menggunakan driver 'log' atau default .env
            Config::set('mail.default', 'smtp'); 
            
            // [PERBAIKAN 2] Konfigurasi Array Lengkap dengan Bypass SSL
            // Ini agar PHP tidak menolak koneksi ke Google karena masalah sertifikat lokal
            $encryption = $smtp->port == 465 ? 'ssl' : 'tls';
            
            Config::set('mail.mailers.smtp', [
                'transport' => 'smtp',
                'host'       => $smtp->host,
                'port'       => $smtp->port,
                'encryption' => $encryption,
                'username'   => $smtp->auth_user,
                'password'   => $smtp->auth_pass,
                'timeout'    => null,
                'auth_mode'  => null,
                // Opsi 'stream' ini SANGAT PENTING untuk mengatasi email tidak masuk/gagal koneksi
                'stream'     => [
                    'ssl' => [
                        'allow_self_signed' => true,
                        'verify_peer'       => false,
                        'verify_peer_name'  => false,
                    ],
                ],
            ]);
            
            // Set Pengirim Global
            Config::set('mail.from.address', $smtp->auth_user);
            Config::set('mail.from.name', $smtp->from_name ?? 'Admin Sistem');

            // Reset Instance agar config baru terbaca
            app()->forgetInstance('mailer');
            Mail::clearResolvedInstances();
            
            return true;
        } catch (\Throwable $e) {
            Log::error("Setup Mailer Error: " . $e->getMessage());
            return false;
        }
    }

    public function index(Request $request)
    {
        if ($request->user()->role !== 'superadmin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $requests = PasswordResetRequest::orderBy('created_at', 'desc')->get();
        return response()->json($requests);
    }

    public function approve(Request $request)
    {
        if ($request->user()->role !== 'superadmin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'id' => 'required',
            'newPassword' => 'required|min:6'
        ]);

        // Cek SMTP dulu
        if (!$this->setupMailer($request->user()->id)) {
            return response()->json([
                'message' => 'Gagal! Konfigurasi Email belum disetting. Silakan ke menu Pengaturan Email.'
            ], 400);
        }

        DB::beginTransaction();

        try {
            $resetRequest = PasswordResetRequest::find($request->id);
            if (!$resetRequest) {
                return response()->json(['message' => 'Permintaan tidak ditemukan'], 404);
            }

            $targetAdmin = Admin::where('email', $resetRequest->email)->first();
            
            if (!$targetAdmin) {
                return response()->json(['message' => 'Admin tidak ditemukan.'], 404);
            }

            // 1. Ubah Password Sementara
            $targetAdmin->password = Hash::make($request->newPassword);
            $targetAdmin->save();
            
            // 2. Ubah Status Request
            $resetRequest->status = 'approved'; 
            $resetRequest->save();

            // 3. Kirim Email
            // [MODIFIKASI] Menambahkan from_name ke array details
            $details = [
                'username' => $targetAdmin->username,
                'newPassword' => $request->newPassword,
                'from_name' => Config::get('mail.from.name') // Mengambil nama dari config yang diset di setupMailer
            ];

            // [MODIFIKASI] Mengubah template HTML sesuai request
            Mail::send([], [], function ($message) use ($targetAdmin, $details) {
                $message->to($targetAdmin->email)
                        ->subject("Reset Password Berhasil")
                        ->html("
                            <div style='font-family: Arial, sans-serif; color: #333;'>
                                <h2>Reset Password Berhasil</h2>
                                <p>Halo <b>{$details['username']}</b>,</p>
                                <p>Permintaan reset password Anda telah disetujui oleh Superadmin.</p>
                                <hr />
                                <p>Berikut adalah detail akun Anda yang baru:</p>
                                <ul>
                                    <li><b>Username:</b> {$details['username']}</li>
                                    <li><b>Password Baru:</b> {$details['newPassword']}</li>
                                </ul>
                                <p>Silakan segera login dan ganti password ini demi keamanan.</p>
                                <br />
                                <p>Salam,<br/>{$details['from_name']}</p>
                            </div>
                        ");
            });

            // Jika email berhasil dikirim, baru commit ke database
            DB::commit();

            return response()->json([
                'message' => 'Sukses! Password direset dan email notifikasi terkirim ke ' . $targetAdmin->email
            ]);

        } catch (\Throwable $e) {
            DB::rollBack(); // Batalkan perubahan jika email gagal
            Log::error("Approve Failed: " . $e->getMessage());

            $errMsg = $e->getMessage();
            if (str_contains($errMsg, 'Connection could not be established')) {
                $errMsg = 'Koneksi SMTP gagal. Cek internet atau App Password Gmail Anda.';
            }

            return response()->json([
                'message' => 'Gagal mengirim email. Perubahan password dibatalkan. Error: ' . $errMsg
            ], 500);
        }
    }

    public function reject(Request $request)
    {
        if ($request->user()->role !== 'superadmin') return response()->json(['message' => 'Unauthorized'], 403);
        try {
            $req = PasswordResetRequest::find($request->id);
            if ($req) { 
                $req->status = 'rejected'; 
                $req->save(); 
                return response()->json(['message' => 'Permintaan ditolak.']); 
            }
            return response()->json(['message' => 'Data tidak ditemukan'], 404);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
        }
    }

    public function requestReset(Request $request)
    {
        $request->validate([
            'identifier' => 'required',
            'whatsapp' => 'required',
            'reason' => 'nullable'
        ]);

        try {
            $admin = Admin::where('email', $request->identifier)
                        ->orWhere('username', $request->identifier)
                        ->first();

            if (!$admin) {
                return response()->json(['message' => 'Username atau Email tidak terdaftar.'], 404);
            }

            PasswordResetRequest::create([
                'email' => $admin->email,
                'username' => $admin->username,
                'whatsapp' => $request->whatsapp,
                'reason' => $request->reason,
                'status' => 'pending'
            ]);

            return response()->json(['message' => 'Permintaan reset password berhasil dikirim.']);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
        }
    }
}