<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use App\Models\Question;
use App\Models\Option;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class UjianController extends Controller
{
    /**
     * Helper: Parse data dari request
     */
    private function parseData($request)
    {
        if ($request->has('data')) {
            $data = $request->input('data');
            return is_string($data) ? json_decode($data, true) : $data;
        }
        return $request->all();
    }

    /**
     * GET /api/ujian
     * List semua ujian
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        $targetAdminId = $request->query('target_admin_id');
        $adminIdToQuery = $user->id;

        if ($user->role === 'superadmin' && $targetAdminId) {
            $adminIdToQuery = $targetAdminId;
        }

        $exams = Exam::where('is_deleted', false)
            ->where('admin_id', $adminIdToQuery)
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($exams);
    }

    /**
     * POST /api/ujian
     * Simpan ujian baru
     */
    public function store(Request $request)
    {
        $data = $this->parseData($request);

        if (empty($data['keterangan']) || empty($data['durasi']) || empty($data['soalList'])) {
            return response()->json(['message' => 'Data ujian tidak lengkap.'], 400);
        }

        DB::beginTransaction();
        try {
            $exam = Exam::create([
                'keterangan' => $data['keterangan'],
                'tanggal' => $data['tanggal'],
                'tanggal_berakhir' => $data['tanggalBerakhir'],
                'jam_mulai' => $data['jamMulai'],
                'jam_berakhir' => $data['jamBerakhir'],
                'durasi' => (int) $data['durasi'],
                'acak_soal' => filter_var($data['acakSoal'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'acak_opsi' => filter_var($data['acakOpsi'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'admin_id' => $request->user()->id,
            ]);

            foreach ($data['soalList'] as $index => $soalData) {
                $gambarPath = null;
                $fileKey = "gambar_" . $index;
                
                // --- FIX GAMBAR: Simpan ke storage public ---
                $fileKey = "gambar_" . $index;
                    $gambarPath = null;
                    
                    if ($request->hasFile($fileKey)) {
                        // Jika upload baru
                        $path = $request->file($fileKey)->store('uploads', 'public');
                        $gambarPath = '/storage/' . $path;
                    } elseif (!empty($soalData['gambar'])) {
                        // Jika menggunakan gambar lama
                        $rawPath = $soalData['gambar'];
                        
                        // Cek apakah string mengandung http/https (URL lengkap)
                        if (filter_var($rawPath, FILTER_VALIDATE_URL)) {
                            // Ambil path-nya saja: /storage/uploads/nama.jpg
                            $parsed = parse_url($rawPath, PHP_URL_PATH);
                            $gambarPath = $parsed;
                        } else {
                            // Jika sudah path relatif, pakai langsung
                            $gambarPath = $rawPath;
                        }
                    }

                $fileConfig = null;
                if (($soalData['tipeSoal'] ?? '') === 'soalDokumen') {
                    $fileConfig = [
                        'allowedTypes' => $soalData['allowedTypes'] ?? [],
                        'maxSize' => $soalData['maxSize'] ?? 5,
                        'maxCount' => $soalData['maxCount'] ?? 1
                    ];
                }

                $question = Question::create([
                    'exam_id' => $exam->id,
                    'tipe_soal' => $soalData['tipeSoal'] ?? '',
                    'soal_text' => $soalData['soalText'] ?? '',
                    'gambar' => $gambarPath,
                    'file_config' => $fileConfig,
                    'bobot' => (int) ($soalData['bobot'] ?? 1),
                ]);

                if (in_array($soalData['tipeSoal'], ['pilihanGanda', 'teksSingkat'])) {
                    if ($soalData['tipeSoal'] === 'pilihanGanda' && !empty($soalData['pilihan'])) {
                        $kunci = trim($soalData['kunciJawabanText'] ?? '');
                        foreach ($soalData['pilihan'] as $opsiItem) {
                            $teksOpsi = is_array($opsiItem) ? ($opsiItem['text'] ?? '') : $opsiItem;
                            Option::create([
                                'question_id' => $question->id,
                                'opsi_text' => $teksOpsi,
                                'is_correct' => trim($teksOpsi) === $kunci
                            ]);
                        }
                    } elseif ($soalData['tipeSoal'] === 'teksSingkat' && !empty($soalData['kunciJawabanText'])) {
                        Option::create([
                            'question_id' => $question->id,
                            'opsi_text' => $soalData['kunciJawabanText'],
                            'is_correct' => true
                        ]);
                    }
                }
            }

            DB::commit();
            return response()->json(['id' => $exam->id, 'message' => 'Ujian tersimpan.'], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Gagal simpan ujian: ' . $e->getMessage());
            return response()->json(['message' => 'Gagal menyimpan ujian.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * PUT /api/ujian/:id
     * Update ujian
     */
    public function update(Request $request, $id)
    {
        $data = $this->parseData($request);
        $user = $request->user();

        $exam = Exam::find($id);
        if (!$exam) {
            return response()->json(['message' => 'Ujian tidak ditemukan'], 404);
        }

        if ($user->role !== 'superadmin' && $exam->admin_id !== $user->id) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        DB::beginTransaction();
        try {
            // Update Header
            $exam->update([
                'keterangan' => $data['keterangan'],
                'tanggal' => $data['tanggal'],
                'tanggal_berakhir' => $data['tanggalBerakhir'],
                'jam_mulai' => $data['jamMulai'],
                'jam_berakhir' => $data['jamBerakhir'],
                'durasi' => (int) $data['durasi'],
                'acak_soal' => filter_var($data['acakSoal'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'acak_opsi' => filter_var($data['acakOpsi'] ?? false, FILTER_VALIDATE_BOOLEAN),
            ]);

            // Sinkronisasi Soal
            $sentSoalIds = [];
            
            if (isset($data['soalList']) && is_array($data['soalList'])) {
                foreach ($data['soalList'] as $index => $soalData) {
                    $question = null;

                    // Cek ID soal lama
                    if (!empty($soalData['id']) && $soalData['id'] > 0) {
                        $question = Question::where('id', $soalData['id'])
                                            ->where('exam_id', $exam->id)
                                            ->first();
                        if ($question) {
                            $sentSoalIds[] = $question->id;
                        }
                    }

                    // Handle Gambar
                    $fileKey = "gambar_" . $index;
                    $gambarPath = null;
                    
                    if ($request->hasFile($fileKey)) {
                        // Jika ada upload baru, hapus yang lama jika perlu (opsional)
                        if ($question && $question->gambar && Storage::disk('public')->exists(str_replace('/storage/', '', $question->gambar))) {
                            // Storage::disk('public')->delete(str_replace('/storage/', '', $question->gambar));
                        }
                        
                        $path = $request->file($fileKey)->store('uploads', 'public');
                        $gambarPath = '/storage/' . $path;
                    } elseif (!empty($soalData['gambar'])) {
                        // Jika tidak ada file baru, pakai path yang lama (dikirim dari frontend)
                        // Pastikan hanya path relatif yang disimpan, bukan full URL
                        $rawPath = $soalData['gambar'];
                        // Jika frontend mengirim full URL, kita ambil path-nya saja
                        $parsedUrl = parse_url($rawPath, PHP_URL_PATH); 
                        $gambarPath = $parsedUrl ? $parsedUrl : $rawPath; 
                    }

                    // Config
                    $fileConfig = null;
                    if (($soalData['tipeSoal'] ?? '') === 'soalDokumen') {
                        $fileConfig = [
                            'allowedTypes' => $soalData['allowedTypes'] ?? [],
                            'maxSize' => $soalData['maxSize'] ?? 5,
                            'maxCount' => $soalData['maxCount'] ?? 1
                        ];
                    }

                    $qData = [
                        'exam_id' => $exam->id,
                        'tipe_soal' => $soalData['tipeSoal'] ?? '',
                        'soal_text' => $soalData['soalText'] ?? '',
                        'gambar' => $gambarPath,
                        'file_config' => $fileConfig,
                        'bobot' => (int) ($soalData['bobot'] ?? 1),
                    ];

                    if ($question) {
                        $question->update($qData);
                        $question->options()->delete(); // Reset opsi lama
                    } else {
                        $question = Question::create($qData);
                        $sentSoalIds[] = $question->id;
                    }

                    // Simpan Opsi Baru
                    if (in_array($soalData['tipeSoal'], ['pilihanGanda', 'teksSingkat'])) {
                        if ($soalData['tipeSoal'] === 'pilihanGanda' && !empty($soalData['pilihan'])) {
                            $kunci = trim($soalData['kunciJawabanText'] ?? '');
                            foreach ($soalData['pilihan'] as $opsiItem) {
                                $teksOpsi = is_array($opsiItem) ? ($opsiItem['text'] ?? '') : $opsiItem;
                                Option::create([
                                    'question_id' => $question->id,
                                    'opsi_text' => $teksOpsi,
                                    'is_correct' => trim($teksOpsi) === $kunci
                                ]);
                            }
                        } elseif ($soalData['tipeSoal'] === 'teksSingkat' && !empty($soalData['kunciJawabanText'])) {
                            Option::create([
                                'question_id' => $question->id,
                                'opsi_text' => $soalData['kunciJawabanText'],
                                'is_correct' => true
                            ]);
                        }
                    }
                }
            }

            // Hapus Soal yang tidak dikirim (dihapus user)
            Question::where('exam_id', $exam->id)
                    ->whereNotIn('id', $sentSoalIds)
                    ->delete();

            DB::commit();
            return response()->json(['message' => 'Ujian berhasil diperbarui']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Gagal update ujian: ' . $e->getMessage());
            return response()->json(['message' => 'Gagal update ujian.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/ujian/:id
     * Detail Ujian untuk Admin (Edit)
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();
        $exam = Exam::with(['questions.options'])->find($id);

        if (!$exam) {
            return response()->json(['message' => 'Ujian tidak ditemukan'], 404);
        }

        if ($user->role !== 'superadmin' && $exam->admin_id !== $user->id) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $soalList = $exam->questions->map(function($q) {
            $pilihan = [];
            
            // --- FIX 1: Normalisasi Tipe Soal (Masalah Esai jadi PG) ---
            $tipeSoal = $q->tipe_soal;
            // Jika di DB tertulis 'essay' / 'Essay', ubah jadi 'esai' agar sesuai value select di frontend
            if (strtolower($tipeSoal) === 'essay') {
                $tipeSoal = 'esai';
            }
            if (strtolower($tipeSoal) === 'pilihan_ganda') {
                $tipeSoal = 'pilihanGanda';
            }

            if ($tipeSoal === 'pilihanGanda' || $tipeSoal === 'teksSingkat') {
                $pilihan = $q->options->map(function($opt) {
                    return [
                        'id' => $opt->id,
                        'text' => $opt->opsi_text,
                        'isCorrect' => $opt->is_correct
                    ];
                });
            }

            $config = $q->file_config ?? [];

            // --- FIX 2: Generate Full URL untuk Gambar ---
            $gambarUrl = $q->gambar;
            if ($gambarUrl && !filter_var($gambarUrl, FILTER_VALIDATE_URL)) {
                // Hapus slash di depan jika ada agar url() bekerja benar
                $cleanPath = ltrim($gambarUrl, '/');
                $gambarUrl = url($cleanPath);
            }

            return [
                'id' => $q->id,
                'tipeSoal' => $tipeSoal,
                'bobot' => $q->bobot,
                'soalText' => $q->soal_text,
                'gambar' => $gambarUrl, // Kirim Full URL
                'allowedTypes' => $config['allowedTypes'] ?? [],
                'maxSize' => $config['maxSize'] ?? 5,
                'maxCount' => $config['maxCount'] ?? 1,
                'pilihan' => $pilihan
            ];
        });

        return response()->json([
            'id' => $exam->id,
            'keterangan' => $exam->keterangan,
            'tanggal' => $exam->tanggal,
            'tanggal_berakhir' => $exam->tanggal_berakhir,
            'jam_mulai' => $exam->jam_mulai,
            'jam_berakhir' => $exam->jam_berakhir,
            'acak_soal' => $exam->acak_soal,
            'acak_opsi' => $exam->acak_opsi,
            'durasi' => $exam->durasi,
            'soalList' => $soalList
        ]);
    }

    /**
     * Tambahan: Ambil Detail 1 Soal Saja
     * (Berguna jika EditSoal.jsx melakukan fetch per soal)
     */
    public function getSoalById($id)
    {
        $soal = Question::with('options')->find($id);

        if (!$soal) {
            return response()->json(['message' => 'Soal tidak ditemukan'], 404);
        }

        // --- Normalisasi Tipe Soal ---
        $tipeSoal = $soal->tipe_soal;
        if (strtolower($tipeSoal) === 'essay') {
            $tipeSoal = 'esai';
        }

        // --- Full URL Gambar ---
        $gambarUrl = $soal->gambar;
        if ($gambarUrl && !filter_var($gambarUrl, FILTER_VALIDATE_URL)) {
            $cleanPath = ltrim($gambarUrl, '/');
            $gambarUrl = url($cleanPath);
        }
        $soal->gambar = $gambarUrl;
        $soal->tipe_soal = $tipeSoal;

        return response()->json($soal);
    }

    /**
     * DELETE /api/ujian/:id
     * Soft delete
     */
    public function destroy(Request $request, $id)
    {
        $exam = Exam::find($id);
        if (!$exam) {
            return response()->json(['message' => 'Ujian tidak ditemukan'], 404);
        }

        if ($request->user()->role !== 'superadmin' && $exam->admin_id !== $request->user()->id) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $exam->update(['is_deleted' => true]);
        return response()->json(['message' => 'Ujian berhasil diarsipkan']);
    }

    /**
     * Cek apakah ujian aktif (Public Route untuk Peserta)
     */
    public function checkActive($id)
    {
        $exam = Exam::where('id', $id)->where('is_deleted', 0)->first();

        if (!$exam) {
            return response()->json(['message' => 'Ujian tidak ditemukan'], 404);
        }

        $now = Carbon::now('Asia/Jakarta'); 
        
        $msg = null;
        
        $startDateTime = Carbon::parse($exam->tanggal . ' ' . $exam->jam_mulai, 'Asia/Jakarta');
        $endDateTime = Carbon::parse($exam->tanggal_berakhir . ' ' . $exam->jam_berakhir, 'Asia/Jakarta');

        if ($now->lessThan($startDateTime)) {
             $msg = "Ujian belum dimulai. (Mulai: " . $startDateTime->format('d/m H:i') . " WIB)";
        } elseif ($now->greaterThan($endDateTime)) {
             $msg = "Ujian sudah berakhir. (Selesai: " . $endDateTime->format('d/m H:i') . " WIB)";
        } else {
            $currentTime = $now->format('H:i:s');
            if ($currentTime < $exam->jam_mulai || $currentTime > $exam->jam_berakhir) {
                $msg = "Sesi ujian saat ini ditutup. Akses dibuka pukul: " . $exam->jam_mulai . " - " . $exam->jam_berakhir . " WIB";
            }
        }

        if ($msg) {
            return response()->json(['message' => $msg], 403);
        }

        return response()->json($exam);
    }

    /**
     * GET /api/ujian/public/:id
     * Ambil soal untuk dikerjakan (Tanpa Kunci Jawaban)
     */
    public function showPublic($id)
    {
        $exam = Exam::with(['questions.options'])->find($id);
        if (!$exam) return response()->json(['message' => 'Ujian tidak ditemukan'], 404);

        $soalList = $exam->questions->map(function($q) {
            $pilihan = $q->options->map(function($opt) {
                return [
                    'id' => $opt->id,
                    'text' => $opt->opsi_text,
                    // PENTING: Jangan kirim is_correct ke frontend peserta!
                ];
            });
            
            // --- FIX 2: Generate Full URL untuk Gambar di Peserta ---
            $gambarUrl = $q->gambar;
            if ($gambarUrl && !filter_var($gambarUrl, FILTER_VALIDATE_URL)) {
                $cleanPath = ltrim($gambarUrl, '/');
                $gambarUrl = url($cleanPath);
            }

            return [
                'id' => $q->id,
                'tipeSoal' => $q->tipe_soal,
                'soalText' => $q->soal_text,
                'gambar' => $gambarUrl,
                'bobot' => $q->bobot,
                'fileConfig' => $q->file_config,
                'pilihan' => $pilihan
            ];
        });
        
        return response()->json([
            'id' => $exam->id,
            'keterangan' => $exam->keterangan,
            'durasi' => $exam->durasi,
            'tanggal' => $exam->tanggal,
            'tanggal_berakhir' => $exam->tanggal_berakhir,
            'jam_mulai' => $exam->jam_mulai,
            'jam_berakhir' => $exam->jam_berakhir,
            'acak_soal' => $exam->acak_soal,
            'acak_opsi' => $exam->acak_opsi,
            'soalList' => $soalList
        ]);
    }

    public function uploadPeserta(Request $request)
    {
        if ($request->hasFile('file')) {
            try {
                $file = $request->file('file');
                // Simpan ke folder public/uploads_jawaban
                $path = $file->store('uploads_jawaban', 'public');
                
                return response()->json([
                    'message' => 'Upload berhasil',
                    'filePath' => '/storage/' . $path, // Path relatif untuk disimpan di DB
                    'originalName' => $file->getClientOriginalName()
                ]);
            } catch (\Exception $e) {
                return response()->json(['message' => 'Gagal upload file: ' . $e->getMessage()], 500);
            }
        }
        return response()->json(['message' => 'Tidak ada file yang dikirim'], 400);
    }
}