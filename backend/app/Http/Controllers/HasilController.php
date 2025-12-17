<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use App\Models\HasilUjian;
use App\Models\Option;
use App\Models\Question;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class HasilController extends Controller
{
    /**
     * Helper: Normalize input data (Sama seperti Node: parseBodyData)
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
     * POST /api/hasil/draft
     * Simpan Draft (Autosave) - Tanpa Penilaian
     */
    public function storeDraft(Request $request)
    {
        $data = $this->parseData($request);

        if (empty($data['peserta_id']) || empty($data['exam_id']) || empty($data['jawaban'])) {
            return response()->json(['message' => 'Data draft tidak lengkap'], 400);
        }

        DB::beginTransaction();
        try {
            foreach ($data['jawaban'] as $j) {
                if (empty($j['question_id'])) continue;

                // [LOGIC SAMA SEPERTI NODE] Simpan jawaban apa adanya, benar = 0
                HasilUjian::updateOrCreate(
                    [
                        'peserta_id' => $data['peserta_id'],
                        'exam_id' => $data['exam_id'],
                        'question_id' => $j['question_id']
                    ],
                    [
                        'jawaban_text' => $j['jawaban_text'] ?? null,
                        'benar' => false 
                    ]
                );
            }
            DB::commit();
            return response()->json(['message' => '✅ Draft jawaban tersimpan']);

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Draft Error: " . $e->getMessage());
            return response()->json(['message' => 'Gagal simpan draft', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/hasil
     * Submit Jawaban Final & Penilaian Otomatis
     */
    public function store(Request $request)
    {
        $data = $this->parseData($request);
        
        if (empty($data['peserta_id']) || empty($data['exam_id']) || empty($data['jawaban'])) {
            return response()->json(['message' => 'Data ujian tidak lengkap'], 400);
        }

        DB::beginTransaction();
        try {
            foreach ($data['jawaban'] as $j) {
                if (empty($j['question_id'])) continue;

                $questionId = $j['question_id'];
                $tipeSoal = $j['tipe_soal'] ?? '';
                $jawabanText = $j['jawaban_text'] ?? null;
                $isCorrect = false;

                // --- [LOGIC PENILAIAN MIRIP NODE.JS] ---

                // 1. Soal Dokumen
                // Frontend PartSoal.jsx mengirim JSON String path file yang sudah diupload.
                if ($tipeSoal === 'soalDokumen') {
                    $isCorrect = false; // Penilaian manual
                    // $jawabanText disimpan apa adanya (JSON string path)
                }

                // 2. Pilihan Ganda (Grading via ID)
                else if (($tipeSoal === 'pilihanGanda' || $tipeSoal === 'pilihan_ganda') && !empty($jawabanText)) {
                    $optionId = (int) $jawabanText;
                    
                    if ($optionId > 0) {
                        $opsi = Option::find($optionId);
                        if ($opsi) {
                            $isCorrect = (bool) $opsi->is_correct;
                            // [PENTING] Node menyimpan TEKS opsi yang dipilih, bukan ID-nya saja untuk keperluan display history
                            $jawabanText = $opsi->opsi_text; 
                        }
                    }
                }

                // 3. Teks Singkat (Grading Normalisasi String)
                else if (($tipeSoal === 'teksSingkat' || $tipeSoal === 'tekssingkat') && !empty($jawabanText)) {
                    // Ambil kunci jawaban
                    $kunci = Option::where('question_id', $questionId)
                                   ->where('is_correct', true)
                                   ->first();
                    
                    if ($kunci && !empty($kunci->opsi_text)) {
                        // [LOGIC NODE] Normalisasi: lowercase & hapus spasi
                        $kunciRaw = strtolower(str_replace(' ', '', $kunci->opsi_text)); 
                        $userAnswer = strtolower(str_replace(' ', '', $jawabanText));
                        
                        // Split koma (jika ada beberapa variasi jawaban benar)
                        $kunciArr = explode(',', $kunciRaw);
                        
                        if (in_array($userAnswer, $kunciArr)) {
                            $isCorrect = true;
                        }
                    }
                }

                // 4. Esai (Manual Grading)
                // Disimpan apa adanya, isCorrect default false.

                // Simpan ke Database
                HasilUjian::updateOrCreate(
                    [
                        'peserta_id' => $data['peserta_id'],
                        'exam_id' => $data['exam_id'],
                        'question_id' => $questionId
                    ],
                    [
                        'jawaban_text' => $jawabanText,
                        'benar' => $isCorrect,
                        // created_at diperbarui untuk menandai waktu submit
                        'created_at' => now(), 
                    ]
                );
            }

            DB::commit();
            return response()->json(['message' => '✅ Hasil ujian berhasil disimpan dan dinilai']);

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Submit Ujian Error: " . $e->getMessage());
            return response()->json([
                'message' => 'Gagal menyimpan hasil ujian.', 
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * GET /api/hasil
     * Rekap Hasil Ujian (Admin List)
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $targetAdminId = $request->query('target_admin_id');
        
        $query = DB::table('hasil_ujian as h')
            ->join('peserta as p', 'p.id', '=', 'h.peserta_id')
            ->join('exams as e', 'e.id', '=', 'h.exam_id')
            ->join('questions as q', 'q.id', '=', 'h.question_id')
            ->select(
                'p.id as peserta_id', 'p.nama', 'p.email', 'p.nohp',
                'e.id as exam_id', 'e.keterangan as ujian', 'e.admin_id', // Tambah admin_id
                'q.id as question_id', 'q.soal_text', 'q.tipe_soal', 'q.bobot',
                'h.jawaban_text', 'h.benar', 'h.created_at'
            );

        // Filter Logic (Sama seperti Node)
        if ($user->role === 'superadmin') {
            if ($targetAdminId) {
                $query->where('e.admin_id', $targetAdminId);
            }
        } else {
            $query->where('e.admin_id', $user->id);
        }

        $rows = $query->orderBy('e.id')->orderBy('p.id')->orderBy('q.id')->get();

        // [LOGIC NODE] Normalisasi response (parsing JSON file & kunci jawaban)
        $normalized = $rows->map(function ($row) {
            // Parsing File Dokumen
            if ($row->tipe_soal === 'soalDokumen') {
                $files = [];
                try {
                    $decoded = json_decode($row->jawaban_text);
                    if (is_array($decoded)) {
                        $files = $decoded;
                    } else if (!empty($row->jawaban_text)) {
                        $files = [$row->jawaban_text];
                    }
                } catch (\Exception $e) {
                    $files = [$row->jawaban_text];
                }
                $row->jawaban_files = $files;
                $row->jawaban_text = $files[0] ?? null; // Tampilkan file pertama di text
            }
            
            // Tambahkan Kunci Jawaban (Untuk Admin melihat di Excel)
            $kunci = Option::where('question_id', $row->question_id)
                           ->where('is_correct', true)
                           ->pluck('opsi_text')
                           ->implode(', ');
            $row->kunci_jawaban_text = $kunci;

            return $row;
        });

        return response()->json($normalized);
    }

    /**
     * GET /api/hasil/peserta/:peserta_id
     * Detail Hasil Peserta (Untuk Halaman HasilAkhir.jsx)
     */
    public function showByPeserta(Request $request, $pesertaId)
    {
        $user = $request->user();
        $targetAdminId = $request->query('target_admin_id');
        
        $query = DB::table('hasil_ujian as h')
            ->join('questions as q', 'q.id', '=', 'h.question_id')
            ->join('exams as e', 'e.id', '=', 'h.exam_id')
            ->where('h.peserta_id', $pesertaId)
            ->select(
                'q.id as question_id', 'q.soal_text', 'q.tipe_soal', 'q.bobot',
                'h.jawaban_text', 'h.benar', 'h.created_at', 'h.exam_id',
                'e.keterangan as keterangan_ujian', 'e.admin_id'
            );

        // Filter Kepemilikan (Sama seperti Node)
        if ($user->role === 'superadmin') {
            if ($targetAdminId) {
                $query->where('e.admin_id', $targetAdminId);
            }
        } else {
            $query->where('e.admin_id', $user->id);
        }

        $rows = $query->orderBy('q.id')->get();

        if ($rows->isEmpty()) {
            return response()->json(['message' => 'Hasil ujian tidak ditemukan'], 404);
        }

        // [LOGIC NODE] Populate Pilihan & Normalisasi Dokumen
        foreach ($rows as $row) {
            $row->pilihan = [];
            
            // Sertakan Opsi untuk PG & Teks Singkat (agar admin bisa lihat detailnya)
            if (in_array($row->tipe_soal, ['pilihanGanda', 'pilihan_ganda', 'teksSingkat', 'tekssingkat'])) {
                $options = Option::where('question_id', $row->question_id)
                    ->select('id', 'opsi_text', 'is_correct')
                    ->get();
                
                $row->pilihan = $options->map(function($opt) {
                    return [
                        'id' => $opt->id,
                        'text' => $opt->opsi_text,
                        'opsi_text' => $opt->opsi_text, // Frontend pakai ini
                        'is_correct' => (bool)$opt->is_correct
                    ];
                });
            }

            // Parsing JSON Path File Dokumen
            if ($row->tipe_soal === 'soalDokumen') {
                $files = [];
                try {
                    $decoded = json_decode($row->jawaban_text);
                    if (is_array($decoded)) $files = $decoded;
                    else if (!empty($row->jawaban_text)) $files = [$row->jawaban_text];
                } catch (\Exception $e) {}
                
                $row->jawaban_files = $files;
                
                // Bersihkan tampilan text agar tidak terlihat raw JSON di UI text biasa
                if (!empty($files)) {
                    $row->jawaban_text = count($files) . " File terupload"; 
                }
            }
        }

        return response()->json($rows);
    }

    /**
     * PUT /api/hasil/nilai-manual
     * Update Nilai Manual (Admin)
     */
    public function updateNilaiManual(Request $request)
    {
        $request->validate([
            'peserta_id' => 'required',
            'exam_id' => 'required',
            'question_id' => 'required',
            'benar' => 'required'
        ]);

        $hasil = HasilUjian::where([
            'peserta_id' => $request->peserta_id,
            'exam_id' => $request->exam_id,
            'question_id' => $request->question_id
        ])->first();

        if (!$hasil) {
            return response()->json(['message' => 'Data hasil tidak ditemukan'], 404);
        }

        // Cek permission
        $exam = Exam::find($request->exam_id);
        if ($request->user()->role !== 'superadmin' && $exam->admin_id !== $request->user()->id) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        $statusBenar = filter_var($request->benar, FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
        $hasil->update(['benar' => $statusBenar]);

        return response()->json([
            'message' => 'Nilai berhasil diperbarui', 
            'status' => (bool)$hasil->benar
        ]);
    }
}