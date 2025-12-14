<?php

namespace App\Http\Controllers;

use App\Models\Peserta;
use App\Imports\PesertaImport;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\Log;

class PesertaController extends Controller
{
    /**
     * GET /api/peserta
     * Ambil semua data peserta (Superadmin Only)
     */
    public function index(Request $request)
    {
        if ($request->user()->role !== 'superadmin') {
            return response()->json(['message' => 'Hanya Superadmin yang dapat melihat semua peserta.'], 403);
        }

        $peserta = Peserta::orderBy('created_at', 'desc')->get();
        return response()->json($peserta);
    }

    /**
     * GET /api/peserta/:id
     * Ambil detail peserta
     */
    public function show(Request $request, $id)
    {
        $peserta = Peserta::find($id);
        if (!$peserta) {
            return response()->json(['message' => 'Peserta tidak ditemukan'], 404);
        }

        return response()->json($peserta);
    }

    /**
     * POST /api/peserta
     * Simpan peserta BARU setiap kali dipanggil (Logic Node.js)
     * Ini membuat setiap sesi ujian memiliki ID Peserta unik, sehingga hasil tidak tertimpa.
     */
    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required',
            'nohp' => 'required',
            'email' => 'required|email', 
        ]);

        try {
            // [UBAH LOGIC] Langsung buat baru (Create) tanpa cek existing email.
            // Ini memastikan setiap kali user klik "Mulai Ujian", mereka dapat ID baru.
            // Hasilnya: Di dashboard admin akan muncul baris baru untuk email yang sama.
            
            $peserta = Peserta::create([
                'nama' => $request->nama,
                'nohp' => $request->nohp,
                'email' => $request->email,
                'password' => '123456', // Default value
            ]);

            return response()->json([
                'id' => $peserta->id, 
                'message' => 'Peserta berhasil disimpan (Sesi Baru) ✅'
            ], 201);

        } catch (\Exception $e) {
            Log::error("Gagal simpan peserta: " . $e->getMessage());
            
            // Tangani error jika database masih memaksa UNIQUE pada email
            if (str_contains($e->getMessage(), 'Duplicate entry')) {
                return response()->json([
                    'message' => 'Gagal: Email ini sudah terdaftar & Database melarang duplikat. Harap hapus index UNIQUE pada kolom email di tabel peserta.',
                    'error' => 'Duplicate Entry'
                ], 409);
            }

            return response()->json(['message' => 'Gagal menyimpan data peserta.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * PUT /api/peserta/:id
     * Update data peserta (Route manual via ID)
     * Dipakai jika user kembali ke halaman form dan mengedit data SEBELUM ujian dimulai
     */
    public function update(Request $request, $id)
    {
        $peserta = Peserta::find($id);
        if (!$peserta) {
            return response()->json(['message' => 'Peserta tidak ditemukan'], 404);
        }

        $request->validate([
            'nama' => 'required',
            'nohp' => 'required',
            'email' => 'required|email',
        ]);

        try {
            $peserta->update([
                'nama' => $request->nama,
                'nohp' => $request->nohp,
                'email' => $request->email,
            ]);

            return response()->json([
                'id' => $peserta->id,
                'message' => 'Peserta berhasil diperbarui ✅'
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Gagal memperbarui data peserta.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * DELETE /api/peserta/:id
     * Hapus peserta (Superadmin Only)
     */
    public function destroy(Request $request, $id)
    {
        if ($request->user()->role !== 'superadmin') {
            return response()->json(['message' => 'Hanya Superadmin yang dapat menghapus peserta.'], 403);
        }

        $peserta = Peserta::find($id);
        if (!$peserta) {
            return response()->json(['message' => 'Peserta tidak ditemukan'], 404);
        }

        $peserta->delete();
        return response()->json(['message' => 'Peserta berhasil dihapus']);
    }

    /**
     * POST /api/peserta/import
     * Import Excel
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv'
        ]);

        try {
            Excel::import(new PesertaImport, $request->file('file'));
            return response()->json(['message' => 'Data peserta berhasil diimport!']);
        } catch (\Exception $e) {
            Log::error("Import Error: " . $e->getMessage());
            return response()->json(['message' => 'Gagal import data.', 'error' => $e->getMessage()], 500);
        }
    }
}