// File: src/admin/HasilAkhir.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaFileAlt,
  FaSyncAlt,
  FaExclamationCircle,
  FaCheckCircle,
  FaTimesCircle,
  FaFileContract,
  FaPercentage,
  FaBookOpen,
  FaThumbsUp,
  FaThumbsDown
} from "react-icons/fa";

const API_URL = "https://kompeta.web.bps.go.id";

// Helper format tanggal (Tidak berubah)
const formatTanggal = (isoString) => {
  if (!isoString) return "-";
  try {
    const date = new Date(isoString);
    return date.toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
};

// Helper ambil semua file dokumen dari backend
const getDokumenFiles = (jawaban) => {
  if (Array.isArray(jawaban.jawaban_files)) {
    return jawaban.jawaban_files.filter(Boolean);
  }

  const jt = jawaban.jawaban_text;
  if (!jt) return [];

  if (typeof jt === "string") {
    try {
      const parsed = JSON.parse(jt);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch (_) {
      // bukan JSON, mungkin single path
    }
    return [jt];
  }

  return [];
};

// Komponen StatCard (Tidak berubah)
const StatCard = ({ icon, label, value, color }) => (
  <div className={`bg-white p-4 rounded-xl shadow-lg border-l-4 ${color}`}>
    <div className="flex items-center">
      <div className="p-2 rounded-full">{icon}</div>
      <div className="ml-3">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

// Komponen Modal (Popup) Detail Soal
const DetailSoalModal = ({ soal, nomorSoal, onClose }) => {
  const isBenar = soal.benar;
  const jawabanBenarObj = soal.pilihan?.find((p) => p.is_correct);
  const jawabanBenarText =
    jawabanBenarObj?.opsi_text || "Kunci jawaban tidak ditemukan";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-5 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-800">
            Detail Soal #{nomorSoal}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
          >
            &times;
          </button>
        </div>
        {/* Body Modal */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* 1. Soal */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Soal:
            </label>
            <p className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-800 whitespace-pre-wrap">
              {soal.soal_text}
            </p>
            <p className="text-xs text-gray-500 mt-1">Bobot Nilai: {soal.bobot || 1}</p>
          </div>
          {/* 2. Jawaban Peserta */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Jawaban Peserta:
            </label>
            <div
              className={`border rounded-lg p-4 ${
                isBenar
                  ? "bg-green-50 border-green-300"
                  : "bg-red-50 border-red-300"
              }`}
            >
              <p
                className={`text-lg font-medium ${
                  isBenar ? "text-green-800" : "text-red-800"
                }`}
              >
                {soal.jawaban_text || "(Tidak dijawab)"}
              </p>
              <p
                className={`text-sm font-semibold mt-1 ${
                  isBenar ? "text-green-600" : "text-red-600"
                }`}
              >
                {isBenar ? "BENAR" : "SALAH"}
              </p>
            </div>
          </div>
          {/* 3. Jawaban Benar */}
          {!isBenar && (
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Jawaban Benar:
              </label>
              <div className="border rounded-lg p-4 bg-green-50 border-green-300">
                <p className="text-lg font-medium text-green-800">
                  {jawabanBenarText}
                </p>
              </div>
            </div>
          )}
          {/* 4. Daftar Pilihan */}
          {soal.tipe_soal === "pilihanGanda" && (
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Semua Pilihan:
              </label>
              <div className="space-y-2">
                {soal.pilihan?.map((pil, idx) => {
                  const isJawabanBenar = pil.is_correct;
                  const isJawabanPeserta =
                    pil.opsi_text === soal.jawaban_text;
                  const labelHuruf = String.fromCharCode(
                    "A".charCodeAt(0) + idx
                  );

                  return (
                    <div
                      key={pil.id}
                      className={`border rounded-lg p-3 flex items-start gap-3
                      ${
                        isJawabanBenar
                          ? "border-green-500 bg-green-50 shadow-sm"
                          : "border-gray-200"
                      }
                      ${
                        isJawabanPeserta && !isJawabanBenar
                          ? "border-red-500 bg-red-50"
                          : ""
                      }
                    `}
                    >
                      <span className="font-semibold text-gray-700">
                        {labelHuruf}.
                      </span>
                      <span className="flex-1 text-gray-800">
                        {pil.opsi_text}
                      </span>
                      {isJawabanBenar && (
                        <FaCheckCircle
                          className="text-green-600 mt-1 flex-shrink-0"
                          title="Jawaban Benar"
                        />
                      )}
                      {isJawabanPeserta && !isJawabanBenar && (
                        <FaTimesCircle
                          className="text-red-600 mt-1 flex-shrink-0"
                          title="Pilihan Peserta"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        {/* Footer Modal */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

// Komponen HasilAkhir Utama
const HasilAkhir = () => {
  const { id: pesertaId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const targetAdminId = location.state?.targetAdminId;
  
  const [peserta, setPeserta] = useState(null);
  const [hasil, setHasil] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSoal, setSelectedSoal] = useState(null);
  const [selectedNomor, setSelectedNomor] = useState(0);

  const [submittedAt, setSubmittedAt] = useState(null);
  const [keteranganUjian, setKeteranganUjian] = useState(null);

  useEffect(() => {
    if (!pesertaId) return;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError("");

        const token = sessionStorage.getItem("adminToken");
        if (!token) throw new Error("Token tidak ditemukan.");

        const headers = { Authorization: `Bearer ${token}` };

        const resPeserta = await fetch(
          `${API_URL}/api/peserta/${pesertaId}`,
          { headers }
        );

        const dataPeserta = await resPeserta.json();
        if (!resPeserta.ok) throw new Error(dataPeserta.message);
        setPeserta(dataPeserta);

        let url = `${API_URL}/api/hasil/peserta/${pesertaId}`;
        if (targetAdminId) {
          url += `?target_admin_id=${targetAdminId}`;
        }

        const resHasil = await fetch(url, { headers });

        const dataHasil = await resHasil.json();
        if (!resHasil.ok) throw new Error(dataHasil.message);

        setHasil(dataHasil);

        if (dataHasil.length > 0) {
          setSubmittedAt(dataHasil[0].created_at);
          setKeteranganUjian(dataHasil[0].keterangan_ujian);
        }
      } catch (err) {
        console.error(err);
        setError(err.message || "Gagal memuat data detail");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [pesertaId, targetAdminId]);

  // ==========================
  // Logic Update Nilai Manual
  // ==========================
  const updateNilaiManual = async (questionId, isCorrect) => {
    try {
      const token = sessionStorage.getItem("adminToken");
      const examId = hasil.length > 0 ? hasil[0].exam_id : null;

      if (!pesertaId || !examId || !questionId) return;

      const res = await fetch(`${API_URL}/api/hasil/nilai-manual`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          peserta_id: pesertaId,
          exam_id: examId,
          question_id: questionId,
          benar: isCorrect,
        }),
      });

      if (!res.ok) throw new Error("Gagal update nilai");

      // Update state lokal agar UI berubah langsung
      setHasil((prevHasil) =>
        prevHasil.map((item) =>
          item.question_id === questionId ? { ...item, benar: isCorrect ? 1 : 0 } : item
        )
      );
    } catch (err) {
      alert("Gagal memperbarui nilai: " + err.message);
    }
  };

  // ==========================
  // Kalkulasi Skor Berbasis Bobot
  // ==========================
  const pgAnswers = hasil.filter(
    (h) => h.tipe_soal === "pilihanGanda" || h.tipe_soal === "teksSingkat"
  );
  const esayAnswers = hasil.filter((h) => h.tipe_soal === "esai" || h.tipe_soal === "esay");
  const dokumenAnswers = hasil.filter((h) => h.tipe_soal === "soalDokumen");

  // Hitung Total Bobot Maksimal (Jika semua benar)
  const totalBobotMaksimal = hasil.reduce((acc, curr) => acc + (curr.bobot || 1), 0);
  
  // Hitung Total Bobot yang Diperoleh Peserta (Hanya soal yang benar)
  const totalBobotDiperoleh = hasil.reduce((acc, curr) => {
    return curr.benar ? acc + (curr.bobot || 1) : acc;
  }, 0);

  // Konversi ke Skala 100
  const nilaiAkhir = totalBobotMaksimal > 0 
    ? ((totalBobotDiperoleh / totalBobotMaksimal) * 100).toFixed(1) 
    : 0;

  // Hitung jumlah soal Benar/Salah secara kuantitas
  const jumlahSoal = hasil.length;
  const jumlahBenar = hasil.filter(h => h.benar).length;
  const jumlahSalah = jumlahSoal - jumlahBenar;

  // Handler modal
  const handleBukaModal = (jawaban, nomor) => {
    setSelectedSoal(jawaban);
    setSelectedNomor(nomor);
    setIsModalOpen(true);
  };
  const handleTutupModal = () => {
    setIsModalOpen(false);
    setSelectedSoal(null);
    setSelectedNomor(0);
  };

  // --- RENDER ---
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        <FaSyncAlt className="animate-spin mr-2" /> Memuat data...
      </div>
    );
  }
  if (error || !peserta) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-500">
        <FaExclamationCircle className="text-4xl mb-3" />
        <span className="text-lg">
          Error: {error || "Peserta tidak ditemukan"}
        </span>
        <Link
          to="/admin/hasil-ujian"
          className="mt-4 text-sm text-blue-600 hover:underline"
        >
          &larr; Kembali ke Rekap Hasil
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <div className="bg-white shadow-sm border-b border-gray-300 py-4 pl-14 pr-4 md:px-8 md:py-5 flex justify-between items-center sticky top-0 z-50 transition-all">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-900 flex items-center gap-2">
          {/* Ikon hanya tampil di tablet/desktop */}
          <span className="hidden md:inline-flex">
            <FaFileAlt className="text-blue-600 w-5 h-5 md:w-6 md:h-6" />
          </span>
          <span>Detail Hasil Ujian</span>
        </h2>
        
        <button
          onClick={() => {
            if (targetAdminId) {
              navigate(-1);
            } else {
              navigate("/admin/hasil-ujian");
            }
          }}
          className="flex items-center gap-2 px-3 py-1.5 md:px-3 md:py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition text-xs md:text-sm font-medium border border-gray-300 shadow-sm"
        >
          <span className="text-lg leading-none">&larr;</span>
          <span>Kembali</span>
        </button>
      </div>
      {/* KONTEN */}
      <div className="p-6 md:p-8">
        <div className="p-6 md:p-8 max-w-4xl mx-auto bg-white shadow-xl rounded-xl border border-gray-200">
          
          {/* Bagian 0: Ringkasan Skor */}
          <div className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
              📊 Ringkasan Skor
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<FaPercentage className="text-blue-500 text-2xl" />}
                label="Nilai Akhir (Skala 100)"
                value={`${Number(nilaiAkhir)}`}
                color="border-blue-500"
              />
              <StatCard
                icon={<FaCheckCircle className="text-green-500 text-2xl" />}
                label="Total Bobot Diraih"
                value={`${totalBobotDiperoleh} / ${totalBobotMaksimal}`}
                color="border-green-500"
              />
              <StatCard
                icon={<FaFileContract className="text-yellow-500 text-2xl" />}
                label="Jumlah Soal Benar"
                value={`${jumlahBenar} / ${jumlahSoal}`}
                color="border-yellow-500"
              />
              <StatCard
                icon={<FaTimesCircle className="text-red-500 text-2xl" />}
                label="Jumlah Soal Salah"
                value={jumlahSalah}
                color="border-red-500"
              />
            </div>
          </div>

          {/* Bagian 1: Data Diri */}
          <div className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
              📋 Data Ujian & Peserta
            </h2>
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm text-gray-700">
              <div className="md:col-span-2">
                <DetailItem
                  label="Nama Ujian"
                  value={keteranganUjian}
                  icon={
                    <FaBookOpen className="inline-block mr-1 text-blue-500" />
                  }
                />
              </div>

              <div className="md:col-span-2">
                <DetailItem label="Nama Peserta" value={peserta.nama} />
              </div>
              <div>
                <DetailItem label="Nomor HP" value={peserta.nohp} />
              </div>
              <div>
                <DetailItem label="Email" value={peserta.email} />
              </div>
              <div className="md:col-span-2">
                <DetailItem
                  label="Waktu Submit"
                  value={formatTanggal(submittedAt)}
                />
              </div>
            </div>
          </div>

          {/* Bagian 2: Status Jawaban (Auto-Nilai) */}
          <div className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
              📝 Soal Pilihan Ganda & Teks Singkat (Auto-Nilai)
            </h2>
            <div className="flex flex-wrap gap-2">
              {pgAnswers.length > 0 ? (
                pgAnswers.map((jawaban, idx) => (
                  <button
                    key={jawaban.question_id}
                    onClick={() => handleBukaModal(jawaban, idx + 1)}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold text-sm shadow-sm transition-all hover:shadow-lg hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                      ${
                        jawaban.benar
                          ? "bg-green-100 text-green-700 border border-green-300"
                          : "bg-red-100 text-red-700 border border-red-300"
                      }`}
                    title={`Klik untuk melihat detail soal #${idx + 1}`}
                  >
                    {idx + 1}
                  </button>
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  Tidak ada jawaban (auto-nilai).
                </p>
              )}
            </div>
          </div>

          {/* Bagian 3: Jawaban Esai */}
          <div className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
              ✍️ Jawaban Esai (Penilaian Manual)
            </h2>
            <div className="space-y-6">
              {esayAnswers.length > 0 ? (
                esayAnswers.map((jawaban, idx) => (
                  <div
                    key={jawaban.question_id}
                    className="border-b border-gray-200 pb-4 last:border-b-0"
                  >
                    <div className="flex justify-between items-start">
                        <div className="flex-1 pr-4">
                            <p className="text-xs font-semibold text-gray-500 mb-1">
                            ESAI #{idx + 1}
                            </p>
                            <p className="text-lg font-medium text-gray-900 mb-2 whitespace-pre-wrap">
                            {jawaban.soal_text} <span className="text-xs text-gray-500 font-normal ml-2 bg-gray-100 px-2 py-0.5 rounded-full border">Bobot: {jawaban.bobot || 1}</span>
                            </p>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                <p className="text-xs font-semibold text-gray-600 mb-1">
                                    Jawaban Peserta:
                                </p>
                                <p className="text-sm text-gray-800 whitespace-pre-wrap">
                                    {jawaban.jawaban_text || "(Tidak dijawab)"}
                                </p>
                            </div>
                        </div>

                        {/* Tombol Nilai Manual */}
                        <div className="flex flex-col gap-2 min-w-[120px] pt-6">
                            <p className="text-xs font-semibold text-gray-500 text-center mb-1">Beri Nilai:</p>
                            <button
                                onClick={() => updateNilaiManual(jawaban.question_id, true)}
                                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md border transition text-sm font-medium ${
                                    jawaban.benar 
                                    ? "bg-green-600 text-white border-green-600 shadow-md" 
                                    : "bg-white text-gray-500 border-gray-300 hover:bg-green-50 hover:text-green-600"
                                }`}
                            >
                                <FaThumbsUp /> Benar
                            </button>
                            <button
                                onClick={() => updateNilaiManual(jawaban.question_id, false)}
                                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md border transition text-sm font-medium ${
                                    !jawaban.benar 
                                    ? "bg-red-600 text-white border-red-600 shadow-md" 
                                    : "bg-white text-gray-500 border-gray-300 hover:bg-red-50 hover:text-red-600"
                                }`}
                            >
                                <FaThumbsDown /> Salah
                            </button>
                        </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  Tidak ada jawaban esai.
                </p>
              )}
            </div>
          </div>

          {/* Bagian 4: Jawaban Dokumen */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
              📎 Jawaban Dokumen (Penilaian Manual)
            </h2>

            <div className="space-y-6">
              {dokumenAnswers.length > 0 ? (
                dokumenAnswers.map((jawaban, idx) => {
                  const files = getDokumenFiles(jawaban);

                  return (
                    <div
                      key={jawaban.question_id}
                      className="border-b border-gray-200 pb-4 last:border-b-0"
                    >
                      <div className="flex justify-between items-start">
                          <div className="flex-1 pr-4">
                              <p className="text-xs font-semibold text-gray-500 mb-1">
                                DOKUMEN #{idx + 1}
                              </p>

                              <p className="text-lg font-medium text-gray-900 mb-2 whitespace-pre-wrap">
                                {jawaban.soal_text} <span className="text-xs text-gray-500 font-normal ml-2 bg-gray-100 px-2 py-0.5 rounded-full border">Bobot: {jawaban.bobot || 1}</span>
                              </p>

                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                <p className="text-xs font-semibold text-gray-600 mb-2">
                                  File Peserta:
                                </p>

                                {files.length > 0 ? (
                                  <ul className="space-y-1 list-disc pl-5">
                                    {files.map((fp, i) => (
                                      <li key={`${fp}-${i}`} className="text-sm">
                                        <a
                                          href={`${API_URL}${fp}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-blue-600 hover:underline break-all font-medium"
                                        >
                                          {fp.split("/").pop()}
                                        </a>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-sm text-gray-800">
                                    (Tidak upload file)
                                  </p>
                                )}
                              </div>
                          </div>

                          {/* Tombol Nilai Manual */}
                          <div className="flex flex-col gap-2 min-w-[120px] pt-6">
                            <p className="text-xs font-semibold text-gray-500 text-center mb-1">Beri Nilai:</p>
                            <button
                                onClick={() => updateNilaiManual(jawaban.question_id, true)}
                                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md border transition text-sm font-medium ${
                                    jawaban.benar 
                                    ? "bg-green-600 text-white border-green-600 shadow-md" 
                                    : "bg-white text-gray-500 border-gray-300 hover:bg-green-50 hover:text-green-600"
                                }`}
                            >
                                <FaThumbsUp /> Benar
                            </button>
                            <button
                                onClick={() => updateNilaiManual(jawaban.question_id, false)}
                                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md border transition text-sm font-medium ${
                                    !jawaban.benar 
                                    ? "bg-red-600 text-white border-red-600 shadow-md" 
                                    : "bg-white text-gray-500 border-gray-300 hover:bg-red-50 hover:text-red-600"
                                }`}
                            >
                                <FaThumbsDown /> Salah
                            </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500">
                  Tidak ada jawaban dokumen.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Render Modal */}
      {isModalOpen && (
        <DetailSoalModal
          soal={selectedSoal}
          nomorSoal={selectedNomor}
          onClose={handleTutupModal}
        />
      )}
    </div>
  );
};

// Komponen helper DetailItem
const DetailItem = ({ label, value, icon }) => (
  <div>
    <span className="block text-xs font-medium text-gray-500">
      {icon}
      {label}
    </span>
    <span className="block text-gray-900 font-medium">{value || "-"}</span>
  </div>
);

export default HasilAkhir;