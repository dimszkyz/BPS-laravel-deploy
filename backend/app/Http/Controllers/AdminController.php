<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\SmtpSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    /**
     * Helper: Setup Email Config
     */
    private function setupMailer($userId)
    {
        try {
            $smtp = SmtpSetting::where('user_id', $userId)->first(); 

            if (!$smtp || empty($smtp->auth_user) || empty($smtp->auth_pass) || empty($smtp->host)) {
                return false;
            }

            Config::set('mail.default', 'smtp'); 

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
                'stream'     => [
                    'ssl' => [
                        'allow_self_signed' => true,
                        'verify_peer'       => false,
                        'verify_peer_name'  => false,
                    ],
                ],
            ]);

            Config::set('mail.from.address', $smtp->auth_user);
            Config::set('mail.from.name', $smtp->from_name ?? 'Admin Sistem');

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
        $admins = Admin::orderBy('created_at', 'desc')->get();
        return response()->json($admins);
    }

    public function store(Request $request)
    {
        if ($request->user()->role !== 'superadmin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'username' => 'required|unique:admins,username',
            'email' => 'required|email|unique:admins,email',
            'password' => 'required|min:6',
        ]);

        if (!$this->setupMailer($request->user()->id)) {
             return response()->json([
                'message' => 'Gagal! Konfigurasi Email (SMTP) Superadmin belum disetting.'
            ], 400);
        }

        DB::beginTransaction();
        try {
            $admin = Admin::create([
                'username' => $request->username,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'admin', 
                'is_active' => true
            ]);

            $details = [
                'username' => $admin->username,
                'password' => $request->password,
                'email' => $admin->email,
                'loginLink' => $request->header('origin') . '/admin/login',
                'from_name' => Config::get('mail.from.name')
            ];

            Mail::send([], [], function ($message) use ($details) {
                $message->to($details['email'])
                        ->subject("Pendaftaran Akun Admin Baru")
                        ->html("
                            <div style='font-family: Arial, sans-serif; color: #333;'>
                                <h2>Selamat Datang</h2>
                                <p>Halo <b>{$details['username']}</b>, akun Admin Anda telah dibuat.</p>
                                <ul>
                                    <li>Email: {$details['email']}</li>
                                    <li>Password: {$details['password']}</li>
                                </ul>
                                <a href='{$details['loginLink']}'>Login ke Dashboard</a>
                            </div>
                        ");
            });

            DB::commit();
            return response()->json(['message' => 'Admin berhasil ditambahkan.', 'data' => $admin], 201);

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Add Admin Error: " . $e->getMessage());
            return response()->json(['message' => 'Gagal menambahkan admin: ' . $e->getMessage()], 500);
        }
    }

    // HAPUS ADMIN (Destroy)
    public function destroy(Request $request, $id)
    {
        if ($request->user()->role !== 'superadmin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $target = Admin::find($id);
        if (!$target) return response()->json(['message' => 'Admin not found'], 404);
        
        $actor = $request->user();

        // 1. Tidak bisa hapus diri sendiri
        if ($target->id === $actor->id) {
            return response()->json(['message' => 'Tidak bisa menghapus akun sendiri'], 400);
        }

        // 2. Proteksi Super Admin Utama (ID 1) - Tidak ada yang bisa menghapusnya
        if ($target->id === 1) {
            return response()->json(['message' => 'Super Admin Utama tidak dapat dihapus.'], 403);
        }

        // 3. Logika Hierarki: Jika target adalah Super Admin
        if ($target->role === 'superadmin') {
            // Hanya Super Admin Utama (ID 1) yang boleh menghapus Super Admin lain
            if ($actor->id !== 1) {
                return response()->json(['message' => 'Hanya Super Admin Utama yang dapat menghapus Super Admin lain.'], 403);
            }
        }

        $target->delete();
        return response()->json(['message' => 'Admin berhasil dihapus']);
    }

    public function ping()
    {
        return response()->json(['message' => 'pong', 'time' => now()]);
    }

    // UPDATE ROLE
    public function updateRole(Request $request, $id)
    {
        if ($request->user()->role !== 'superadmin') return response()->json(['message' => 'Unauthorized'], 403);

        $target = Admin::find($id);
        if (!$target) return response()->json(['message' => 'Admin not found'], 404);
        
        $actor = $request->user();

        // 1. Proteksi Super Admin Utama (ID 1) - Role tidak bisa diubah (mencegah degradasi diri sendiri/oleh orang lain)
        if ($target->id === 1) {
            return response()->json(['message' => 'Role Super Admin Utama tidak dapat diubah.'], 403);
        }

        // 2. Logika Hierarki: Jika target adalah Super Admin
        if ($target->role === 'superadmin') {
            // Hanya Super Admin Utama (ID 1) yang boleh mengubah role Super Admin lain
            if ($actor->id !== 1) {
                return response()->json(['message' => 'Hanya Super Admin Utama yang dapat mengubah role Super Admin lain.'], 403);
            }
        }

        $target->role = $request->role;
        $target->save();

        return response()->json(['message' => 'Role updated']);
    }

    // UPDATE USERNAME
    public function updateUsername(Request $request, $id)
    {
        // Tetap izinkan semua superadmin mengubah username (atau batasi jika perlu)
        if ($request->user()->role !== 'superadmin' && $request->user()->id != $id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate(['username' => 'required|unique:admins,username,' . $id]);

        $admin = Admin::find($id);
        if (!$admin) return response()->json(['message' => 'Admin not found'], 404);

        // Opsional: Proteksi Username Root jika diinginkan (uncomment jika perlu)
        // if ($admin->id === 1 && $request->user()->id !== 1) return response()->json(['message' => 'Forbidden'], 403);

        $admin->username = $request->username;
        $admin->save();

        return response()->json(['message' => 'Username updated', 'username' => $admin->username]);
    }

    // TOGGLE STATUS (Aktif/Nonaktif)
    public function toggleStatus(Request $request, $id)
    {
        $target = Admin::find($id);
        if (!$target) return response()->json(['message' => 'Admin tidak ditemukan'], 404);

        $actor = $request->user();

        // 1. Proteksi Super Admin Utama (ID 1) - Tidak bisa dinonaktifkan
        if ($target->id === 1) {
            return response()->json(['message' => 'Super Admin Utama tidak dapat dinonaktifkan.'], 403);
        }

        // 2. Logika Hierarki: Jika target adalah Super Admin
        if ($target->role === 'superadmin') {
            // Hanya Super Admin Utama (ID 1) yang boleh menonaktifkan Super Admin lain
            if ($actor->id !== 1) {
                return response()->json(['message' => 'Hanya Super Admin Utama yang dapat menonaktifkan Super Admin lain.'], 403);
            }
        }

        $target->is_active = !$target->is_active;
        $target->save();

        return response()->json([
            'message' => 'Status admin berhasil diperbarui.',
            'newStatus' => $target->is_active ? 1 : 0
        ]);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'currentPassword' => 'required',
            'newPassword' => 'required|min:6',
        ]);

        $admin = $request->user();

        if (!Hash::check($request->currentPassword, $admin->password)) {
            return response()->json(['message' => 'Password lama salah.'], 401);
        }

        if (Hash::check($request->newPassword, $admin->password)) {
            return response()->json(['message' => 'Password baru tidak boleh sama dengan password lama.'], 400);
        }

        $admin->password = Hash::make($request->newPassword);
        $admin->save();

        return response()->json(['message' => 'Password berhasil diubah.']);
    }
}