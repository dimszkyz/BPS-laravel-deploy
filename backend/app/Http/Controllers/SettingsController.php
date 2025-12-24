<?php

namespace App\Http\Controllers;

use App\Models\AppSetting;
use App\Models\SmtpSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str; 

class SettingsController extends Controller
{
    /**
     * GET /api/settings
     * Mengambil semua pengaturan umum (Public)
     */
    public function index()
    {
        // Ambil semua setting dari DB
        $settings = AppSetting::all()->pluck('setting_value', 'setting_key');

        $response = $settings->toArray();
        
        // Return format key-value object
        return response()->json($response);
    }

    /**
     * POST /api/settings
     * Simpan pengaturan (Admin Only)
     */
    public function update(Request $request)
    {
        // Handle Uploads (Logo & Backgrounds)
        $this->handleUpload($request, 'adminBgImage');
        $this->handleUpload($request, 'pesertaBgImage');
        $this->handleUpload($request, 'headerLogo');

        // Handle Text Header
        if ($request->has('headerText')) {
            AppSetting::updateOrCreate(
                ['setting_key' => 'headerText'],
                ['setting_value' => $request->headerText]
            );
        }

        return response()->json(['message' => 'Pengaturan berhasil diperbarui!']);
    }

    // Helper untuk upload gambar settings LANGSUNG KE FOLDER PUBLIC
    private function handleUpload($request, $key)
    {
        if ($request->hasFile($key)) {
            $file = $request->file($key);
            
            // Generate nama file unik: timestamp_random.ext
            $filename = time() . '_' . Str::random(5) . '.' . $file->getClientOriginalExtension();
            
            // Tentukan folder tujuan: public/uploads/settings
            $destinationPath = public_path('uploads/settings');

            // Pindahkan file ke folder public backend
            $file->move($destinationPath, $filename);

            // Simpan path relatif ke database (agar bisa diakses frontend via BASE_URL + path)
            AppSetting::updateOrCreate(
                ['setting_key' => $key],
                ['setting_value' => '/uploads/settings/' . $filename]
            );
        }
    }

    /**
     * GET /api/settings/smtp
     * Ambil setting SMTP (Admin Only)
     */
    public function getSmtp()
    {
        $smtp = SmtpSetting::where('user_id', Auth::id())->first();

        if (!$smtp) {
            return response()->json([
                'service' => 'gmail',
                'host' => 'smtp.gmail.com',
                'port' => 587,
                'secure' => false,
                'auth_user' => '',
                'auth_pass' => '',
                'from_name' => 'Admin Ujian',
            ]);
        }
        return response()->json($smtp);
    }

    /**
     * PUT /api/settings/smtp
     * Update setting SMTP (Admin Only)
     */
    public function updateSmtp(Request $request)
    {
        // [PERUBAHAN] Logika Validasi Kondisional
        $rules = [
            'auth_user' => 'required',
            'auth_pass' => 'required',
        ];

        // Jika user memilih "Tanpa Layanan", username & password boleh kosong
        if ($request->service === 'none') {
            $rules['auth_user'] = 'nullable';
            $rules['auth_pass'] = 'nullable';
        }

        $validated = $request->validate($rules);

        SmtpSetting::updateOrCreate(
            ['user_id' => Auth::id()],
            [
                'service' => $request->service ?? 'gmail',
                'host' => $request->host ?? 'smtp.gmail.com',
                'port' => $request->port ?? 587,
                'secure' => filter_var($request->secure, FILTER_VALIDATE_BOOLEAN),
                'auth_user' => $request->auth_user,
                'auth_pass' => $request->auth_pass,
                'from_name' => $request->from_name ?? 'Admin Ujian',
            ]
        );

        return response()->json(['message' => 'Pengaturan email berhasil disimpan untuk akun ini.']);
    }
}