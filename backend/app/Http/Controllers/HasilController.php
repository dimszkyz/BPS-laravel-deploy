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
    private function parseData($request)
    {
        if ($request->has('data')) {
            $data = $request->input('data');
            return is_string($data) ? json_decode($data, true) : $data;
        }
        return $request->all();
    }

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
                
                if ($tipeSoal === 'soalDokumen') {
                    $isCorrect = false; 
                }

                else if (($tipeSoal === 'pilihanGanda' || $tipeSoal === 'pilihan_ganda') && !empty($jawabanText)) {
                    $optionId = (int) $jawabanText;

                    if ($optionId > 0) {
                        $opsi = Option::withTrashed()->find($optionId);
                        if ($opsi) {
                            $isCorrect = (bool) $opsi->is_correct;
                            $jawabanText = $opsi->opsi_text;
                        } else {
                            $jawabanText = "Opsi ID: $optionId (Data Lama)";
                        }
                    }
                }
                else if (($tipeSoal === 'teksSingkat' || $tipeSoal === 'tekssingkat') && !empty($jawabanText)) {
                    $kunci = Option::where('question_id', $questionId)
                        ->where('is_correct', true)
                        ->first();

                    if ($kunci && !empty($kunci->opsi_text)) {
                        $kunciRaw = strtolower(str_replace(' ', '', $kunci->opsi_text));
                        $userAnswer = strtolower(str_replace(' ', '', $jawabanText));
                        $kunciArr = explode(',', $kunciRaw);

                        if (in_array($userAnswer, $kunciArr)) {
                            $isCorrect = true;
                        }
                    }
                }

                HasilUjian::updateOrCreate(
                    [
                        'peserta_id' => $data['peserta_id'],
                        'exam_id' => $data['exam_id'],
                        'question_id' => $questionId
                    ],
                    [
                        'jawaban_text' => $jawabanText,
                        'benar' => $isCorrect,
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

    public function index(Request $request)
    {
        $user = $request->user();
        $targetAdminId = $request->query('target_admin_id');

        $query = DB::table('hasil_ujian as h')
            ->join('peserta as p', 'p.id', '=', 'h.peserta_id')
            ->join('exams as e', 'e.id', '=', 'h.exam_id')
            ->join('questions as q', 'q.id', '=', 'h.question_id')
            ->select(
                'p.id as peserta_id',
                'p.nama',
                'p.email',
                'p.nohp',
                'e.id as exam_id',
                'e.keterangan as ujian',
                'e.admin_id', 
                'q.id as question_id',
                'q.soal_text',
                'q.tipe_soal',
                'q.bobot',
                'h.jawaban_text',
                'h.benar',
                'h.created_at'
            );

        if ($user->role === 'superadmin') {
            if ($targetAdminId) {
                $query->where('e.admin_id', $targetAdminId);
            }
        } else {
            $query->where('e.admin_id', $user->id);
        }

        $rows = $query->orderBy('e.id')->orderBy('p.id')->orderBy('q.id')->get();

        $normalized = $rows->map(function ($row) {
            if ($row->tipe_soal === 'soalDokumen') {
                $files = [];
                try {
                    $decoded = json_decode($row->jawaban_text, true);
                    $rawPaths = is_array($decoded) ? $decoded : (!empty($row->jawaban_text) ? [$row->jawaban_text] : []);

                    foreach ($rawPaths as $path) {
                        $cleanPath = ltrim(str_replace('storage/', '', $path), '/');
                        // Hasil: https://kompeta.web.bps.go.id/storage/uploads_jawaban/xxx.jpg
                        $files[] = '/storage/' . $cleanPath;
                    }
                } catch (\Exception $e) {
                    $files = [];
                }

                $row->jawaban_files = $files;
                $row->jawaban_text = $files[0] ?? null;
            }

            $kunci = Option::where('question_id', $row->question_id)
                ->where('is_correct', true)
                ->pluck('opsi_text')
                ->implode(', ');
            $row->kunci_jawaban_text = $kunci;

            return $row;
        });

        return response()->json($normalized);
    }

    public function showByPeserta(Request $request, $pesertaId)
    {
        $user = $request->user();
        $targetAdminId = $request->query('target_admin_id');

        $query = DB::table('hasil_ujian as h')
            ->join('questions as q', 'q.id', '=', 'h.question_id')
            ->join('exams as e', 'e.id', '=', 'h.exam_id')
            ->where('h.peserta_id', $pesertaId)
            ->select(
                'q.id as question_id',
                'q.soal_text',
                'q.tipe_soal',
                'q.bobot',
                'h.jawaban_text',
                'h.benar',
                'h.created_at',
                'h.exam_id',
                'e.keterangan as keterangan_ujian',
                'e.admin_id'
            );

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

        foreach ($rows as $row) {
            $row->pilihan = [];
            if (in_array($row->tipe_soal, ['pilihanGanda', 'pilihan_ganda', 'teksSingkat', 'tekssingkat'])) {
                $options = Option::where('question_id', $row->question_id)
                    ->select('id', 'opsi_text', 'is_correct')
                    ->get();

                $row->pilihan = $options->map(function ($opt) {
                    return [
                        'id' => $opt->id,
                        'text' => $opt->opsi_text,
                        'opsi_text' => $opt->opsi_text, 
                        'is_correct' => (bool)$opt->is_correct
                    ];
                });
            }

            if ($row->tipe_soal === 'soalDokumen') {
                $files = [];
                try {
                    $decoded = json_decode($row->jawaban_text, true);
                    $rawPaths = is_array($decoded) ? $decoded : (!empty($row->jawaban_text) ? [$row->jawaban_text] : []);

                    foreach ($rawPaths as $path) {
                        $cleanPath = ltrim(str_replace('storage/', '', $path), '/');
                        $files[] = '/storage/' . $cleanPath;
                    }
                } catch (\Exception $e) {
                }

                $row->jawaban_files = $files; 

                if (!empty($files)) {
                    $row->jawaban_text = count($files) . " File terupload";
                }
            }
        }

        return response()->json($rows);
    }

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
