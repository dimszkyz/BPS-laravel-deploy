// File: src/admin/EditSoal.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  FaCalendarAlt,
  FaClock,
  FaPlus,
  FaSave,
  FaTrash,
  FaCogs,
  FaListAlt,
  FaImage,
  FaCheckCircle,
  FaFileExcel,
  FaSpinner,
} from "react-icons/fa";

// --- UPDATE: Import helper dari TemplateExcel ---
import {
  generateWorkbookFromState,
  downloadWorkbook,
} from "../admin/TemplateExcel"; // Pastikan path import ini benar sesuai struktur folder Anda

const API_URL = "https://kompeta.web.bps.go.id";

// =======================================================
// KONFIGURASI TIPE FILE (SAMA DENGAN TambahSoal.jsx)
// =======================================================
const FILE_TYPE_GROUPS = [
  { label: "PDF (.pdf)", exts: [".pdf"] },
  { label: "Word (.doc, .docx)", exts: [".doc", ".docx"] },
  { label: "Excel (.xls, .xlsx)", exts: [".xls", ".xlsx"] },
  { label: "Gambar (JPG/PNG)", exts: [".jpg", ".jpeg", ".png"] },
  { label: "ZIP/RAR (.zip, .rar)", exts: [".zip", ".rar"] },
];

// Normalisasi allowedTypes dari DB / data lama:
const normalizeAllowedTypes = (raw) => {
  if (!Array.isArray(raw)) return [];
  const flat = [];

  raw.forEach((item) => {
    if (!item) return;
    String(item)
      .split(",")
      .forEach((part) => {
        let ext = part.trim().toLowerCase();
        if (!ext) return;
        if (!ext.startsWith(".")) ext = "." + ext;
        if (!flat.includes(ext)) flat.push(ext);
      });
  });

  return flat;
};

const EditSoal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isFromSuperAdmin = location.state?.fromSuperAdmin === true;

  const [loading, setLoading] = useState(true);
  const [keterangan, setKeterangan] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [tanggalBerakhir, setTanggalBerakhir] = useState("");
  const [jamMulai, setJamMulai] = useState("");
  const [jamBerakhir, setJamBerakhir] = useState("");
  const [durasi, setDurasi] = useState("");

  const [acakSoal, setAcakSoal] = useState(false);
  const [acakOpsi, setAcakOpsi] = useState(false);

  const [daftarSoal, setDaftarSoal] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");

  // =======================================================
  // ▼▼▼ FETCH DATA UJIAN ▼▼▼
  // =======================================================
  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const token = sessionStorage.getItem("adminToken");
        if (!token) throw new Error("Token tidak ditemukan.");

        const res = await fetch(`${API_URL}/api/ujian/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Gagal memuat data ujian");

        setKeterangan(data.keterangan || "");

        // Format tanggal untuk input type="date" (YYYY-MM-DD)
        const formatDate = (dateStr) => {
            if (!dateStr) return "";
            const d = new Date(dateStr);
            // Gunakan ISO string lalu ambil bagian tanggalnya saja agar aman
            // Atau jika format dari DB sudah YYYY-MM-DD, pakai langsung
            return d.toISOString().split('T')[0]; 
        };

        setTanggal(data.tanggal || "");
        setTanggalBerakhir(data.tanggal_berakhir || "");

        setJamMulai(data.jam_mulai || "");
        setJamBerakhir(data.jam_berakhir || "");
        setDurasi(data.durasi || "");

        setAcakSoal(Boolean(data.acak_soal));
        setAcakOpsi(Boolean(data.acak_opsi));

        setDaftarSoal(
          (data.soalList || []).map((s) => ({
            id: s.id,
            bobot: s.bobot || 1,
            tipeSoal: s.tipeSoal, // Pastikan backend kirim 'esai', 'pilihanGanda', dll
            soalText: s.soalText,
            // Gambar dari server (URL string) disimpan di sini
            gambar: s.gambar || null, 
            // Preview juga pakai URL yang sama
            gambarPreview: s.gambar ? s.gambar : null, 

            // --- MAP DATA CONFIG & NORMALISASI TIPE FILE ---
            allowedTypes: normalizeAllowedTypes(s.allowedTypes || []),
            maxSize: s.maxSize || 5,
            maxCount: s.maxCount || 1,
            // ------------------------------------------------

            pilihan:
              s.tipeSoal === "pilihanGanda" || s.tipeSoal === "teksSingkat"
                ? (s.pilihan || []).map((p) => ({
                    id: p.id,
                    text: p.text,
                    isCorrect: p.isCorrect // Backend kirim boolean
                  }))
                : [],
            
            // Cari ID opsi yang benar untuk radio button
            kunciJawaban:
              s.tipeSoal === "pilihanGanda"
                ? (s.pilihan || []).find((p) => p.isCorrect)?.id || 0
                : 0,
            
            // Text jawaban untuk isian singkat
            kunciJawabanText:
              s.tipeSoal === "teksSingkat"
                ? (s.pilihan || []).find((p) => p.isCorrect)?.text || ""
                : "",
          }))
        );
      } catch (err) {
        alert(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  // =======================================================
  // ▼▼▼ EXPORT UJIAN ▼▼▼
  // =======================================================
  const handleExportUjianSoalExcel = () => {
    const dataToExport = {
      keterangan,
      tanggal,
      tanggalBerakhir,
      jamMulai,
      jamBerakhir,
      durasi,
      acakSoal,
      acakOpsi,
      daftarSoal,
    };

    const wb = generateWorkbookFromState(dataToExport);
    downloadWorkbook(wb, `export_ujian_${id}.xlsx`);
  };

  // === HANDLER GAMBAR ===
  const handleFileChange = (soalId, file) => {
    const updated = daftarSoal.map((s) => {
      if (s.id === soalId) {
        return {
          ...s,
          gambar: file, // Simpan File object
          gambarPreview: file ? URL.createObjectURL(file) : s.gambarPreview,
        };
      }
      return s;
    });
    setDaftarSoal(updated);
  };

  const handleHapusGambar = (soalId) => {
    setDaftarSoal((prev) =>
      prev.map((s) =>
        s.id === soalId ? { ...s, gambar: null, gambarPreview: null } : s
      )
    );
  };

  // === HANDLER SOAL & PILIHAN ===
  const handleTambahSoal = () => {
    const newId = `new_soal_${Date.now()}`;
    const newPilId1 = `new_pil_${Date.now()}_1`;
    const newPilId2 = `new_pil_${Date.now()}_2`;

    setDaftarSoal([
      ...daftarSoal,
      {
        id: newId,
        tipeSoal: "pilihanGanda",
        bobot: 1,
        soalText: "",
        gambar: null,
        gambarPreview: null,
        pilihan: [
          { id: newPilId1, text: "", isCorrect: true },
          { id: newPilId2, text: "", isCorrect: false },
        ],
        kunciJawaban: newPilId1,
        kunciJawabanText: "",
        allowedTypes: [],
        maxSize: 5,
        maxCount: 1,
      },
    ]);
  };

  const handleHapusSoal = (id) => {
    if (daftarSoal.length <= 1) {
      alert("Minimal harus ada satu soal.");
      return;
    }
    setDaftarSoal(daftarSoal.filter((s) => s.id !== id));
  };

  const handleSoalChange = (id, field, value) => {
    setDaftarSoal((prev) => 
        prev.map((s) => s.id === id ? { ...s, [field]: value } : s)
    );
  };

  // =======================================================
  // HANDLE TIPE FILE DOKUMEN
  // =======================================================
  const handleAllowedTypeChange = (soalId, exts) => {
    setDaftarSoal((prev) =>
      prev.map((s) => {
        if (s.id !== soalId) return s;

        const current = s.allowedTypes || [];
        const hasAny = exts.some((ext) => current.includes(ext));

        let next = [...current];

        if (hasAny) {
          next = next.filter((ext) => !exts.includes(ext));
        } else {
          exts.forEach((ext) => {
            if (!next.includes(ext)) {
              next.push(ext);
            }
          });
        }

        return { ...s, allowedTypes: next };
      })
    );
  };

  const handleTambahPilihan = (soalId) => {
    setDaftarSoal((prev) =>
      prev.map((s) =>
        s.id === soalId
          ? {
              ...s,
              pilihan: [
                ...s.pilihan,
                { id: `new_pil_${Date.now()}`, text: "", isCorrect: false },
              ],
            }
          : s
      )
    );
  };

  const handleHapusPilihan = (soalId, pilihanId) => {
    setDaftarSoal((prev) =>
      prev.map((s) => {
        if (s.id === soalId) {
          if (s.pilihan.length <= 2) {
            alert("Minimal harus ada 2 pilihan.");
            return s;
          }
          const newPilihan = s.pilihan.filter((p) => p.id !== pilihanId);
          // Jika yang dihapus adalah kunci jawaban, pindahkan kunci ke opsi pertama
          const currentKunciId = s.kunciJawaban;
          let newKunci = currentKunciId;
          
          if(currentKunciId === pilihanId) {
             newKunci = newPilihan[0]?.id || 0;
          }

          return {
            ...s,
            pilihan: newPilihan,
            kunciJawaban: newKunci,
          };
        }
        return s;
      })
    );
  };

  const handlePilihanChange = (soalId, pilihanId, text) => {
    setDaftarSoal((prev) =>
      prev.map((s) =>
        s.id === soalId
          ? {
              ...s,
              pilihan: s.pilihan.map((p) =>
                p.id === pilihanId ? { ...p, text } : p
              ),
            }
          : s
      )
    );
  };

  const handleKunciJawabanChange = (soalId, pilihanId) => {
    setDaftarSoal((prev) =>
      prev.map((s) =>
        s.id === soalId ? { ...s, kunciJawaban: pilihanId } : s
      )
    );
  };

  // =======================================================
  // ▼▼▼ SIMPAN PERUBAHAN ▼▼▼
  // =======================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!jamMulai || !jamBerakhir) {
      alert("Jam mulai dan jam berakhir wajib diisi.");
      return;
    }
    if (!tanggalBerakhir) {
      alert("Tanggal berakhir wajib diisi.");
      return;
    }
    if (!durasi || parseInt(durasi, 10) <= 0) {
      alert("Durasi pengerjaan wajib diisi dan harus lebih dari 0.");
      return;
    }

    // Siapkan payload JSON
    const soalList = daftarSoal.map((s) => ({
      id: s.id.toString().startsWith("new_") ? null : s.id, // ID null untuk soal baru
      bobot: s.bobot,
      tipeSoal: s.tipeSoal,
      soalText: s.soalText,
      // Jika gambar masih string (URL lama), kirim stringnya
      // Jika gambar Object File (baru upload), nanti dikirim via formData file
      gambar: (typeof s.gambar === 'string') ? s.gambar : null, 
      
      pilihan: s.tipeSoal === "pilihanGanda" ? s.pilihan : [],
      
      // Kirim text jawaban yang benar untuk validasi di backend
      kunciJawabanText:
        s.tipeSoal === "pilihanGanda"
          ? s.pilihan.find((p) => p.id === s.kunciJawaban)?.text || ""
          : s.tipeSoal === "teksSingkat"
          ? s.kunciJawabanText || ""
          : "",
      
      allowedTypes: s.tipeSoal === "soalDokumen" ? s.allowedTypes : [],
      maxSize: s.tipeSoal === "soalDokumen" ? s.maxSize : 0,
      maxCount: s.tipeSoal === "soalDokumen" ? s.maxCount : 0,
    }));

    const formData = new FormData();
    
    // [PENTING] Method Spoofing agar Laravel membaca ini sebagai PUT
    formData.append('_method', 'PUT'); 

    formData.append(
      "data",
      JSON.stringify({
        keterangan,
        tanggal,
        tanggalBerakhir,
        jamMulai,
        jamBerakhir,
        durasi,
        acakSoal,
        acakOpsi,
        soalList,
      })
    );

    // Append file gambar baru
    daftarSoal.forEach((s, i) => {
      // Hanya append jika s.gambar adalah File object (bukan string URL)
      if (s.gambar && typeof s.gambar !== "string") {
        formData.append(`gambar_${i}`, s.gambar);
      }
    });

    try {
      const token = sessionStorage.getItem("adminToken");
      
      // Gunakan POST karena ada file upload + method spoofing
      const res = await fetch(`${API_URL}/api/ujian/${id}`, {
        method: "POST", // Ubah dari PUT ke POST
        headers: {
          Authorization: `Bearer ${token}`,
          // Jangan set Content-Type secara manual saat pakai FormData, browser akan set otomatis
        },
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal menyimpan perubahan");

      setSuccessMessage("Ujian berhasil diperbarui! Mengalihkan...");

      setTimeout(() => {
        if (isFromSuperAdmin) {
          navigate(-1);
        } else {
          navigate("/admin/daftar-soal");
        }
      }, 2000);
    } catch (err) {
      alert("Terjadi kesalahan: " + err.message);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <FaSpinner className="text-blue-600 text-3xl animate-spin" />
          <p className="text-gray-600 font-medium">Memuat data ujian...</p>
        </div>
      </div>
    );

  const labelClass =
    "block text-sm font-semibold text-gray-700 mb-1 tracking-wide";
  const inputClass =
    "block w-full rounded-md border border-gray-300 bg-white shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 text-sm py-2.5 px-3";
  const textAreaClass =
    "block w-full rounded-md border border-gray-300 bg-white shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 text-sm p-3 min-h-[100px]";
  const fieldsetClass =
    "bg-white rounded-xl border border-gray-100 shadow-sm p-6 transition duration-200";

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col pb-10">
      {/* NOTIFIKASI SUKSES */}
      {successMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-[90%] md:w-full max-w-lg px-2 sm:px-4 transition-all duration-300">
          <div className="flex items-center justify-between gap-4 bg-green-600 text-white px-5 py-4 rounded-xl shadow-2xl animate-bounce-in border border-green-500 backdrop-blur-sm bg-opacity-95">
            <div className="flex items-center gap-3 overflow-hidden">
              <FaCheckCircle className="text-white w-6 h-6 flex-shrink-0" />
              <span className="font-semibold text-sm md:text-base truncate">
                {successMessage}
              </span>
            </div>
            <div className="flex items-center gap-2 pl-2 border-l border-green-400/50">
              <FaSpinner className="w-5 h-5 text-white animate-spin flex-shrink-0" />
            </div>
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <div className="bg-white shadow-sm border-b border-gray-300 py-4 pl-14 pr-4 md:px-8 md:py-5 sticky top-0 z-50 flex justify-between items-center transition-all">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <span className="hidden md:inline-block text-blue-600 text-2xl">
            🧩
          </span>
          <span>Edit Ujian</span>
        </h2>

        <div className="hidden md:flex gap-2 items-center">
          <button
            type="button"
            onClick={handleExportUjianSoalExcel}
            className="flex items-center gap-2 px-3 lg:px-4 py-2 rounded-md bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 transition text-xs lg:text-sm"
          >
            <FaFileExcel />
            <span className="hidden lg:inline">Export</span> Ujian
          </button>

          <button
            onClick={() => {
              if (isFromSuperAdmin) navigate(-1);
              else navigate("/admin/daftar-soal");
            }}
            className="flex items-center gap-2 px-3 lg:px-4 py-2 rounded-md bg-gray-100 text-gray-700 font-semibold border border-gray-300 hover:bg-gray-200 transition text-xs lg:text-sm"
          >
            Batal
          </button>

          <button
            type="submit"
            form="form-edit-soal"
            className="flex items-center gap-2 px-4 lg:px-5 py-2 rounded-md bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition text-xs lg:text-sm"
          >
            <FaSave />
            Simpan Perubahan
          </button>
        </div>
      </div>

      {/* KONTEN UTAMA */}
      <div className="p-4 md:p-10 overflow-y-auto">
        {/* MENU AKSI MOBILE */}
        <div className="md:hidden mb-6 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-100 pb-2">
            Menu Aksi Cepat
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleExportUjianSoalExcel}
              className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-lg bg-indigo-50 text-indigo-700 font-medium hover:bg-indigo-100 transition text-xs border border-indigo-100"
            >
              <FaFileExcel className="w-5 h-5 mb-1" />
              Export Ujian
            </button>

            <button
              onClick={() => {
                if (isFromSuperAdmin) navigate(-1);
                else navigate("/admin/daftar-soal");
              }}
              className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-lg bg-gray-50 text-gray-600 font-medium hover:bg-gray-100 transition text-xs border border-gray-200"
            >
              <span className="text-lg font-bold">✕</span>
              Batal
            </button>

            <button
              type="submit"
              form="form-edit-soal"
              className="col-span-2 flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-lg bg-blue-600 text-white font-medium shadow hover:bg-blue-700 transition text-xs"
            >
              <FaSave className="w-5 h-5 mb-1" />
              Simpan Perubahan
            </button>
          </div>
        </div>

        {/* FORM EDIT */}
        <form
          id="form-edit-soal"
          onSubmit={handleSubmit}
          className="space-y-8 max-w-5xl mx-auto"
        >
          {/* Pengaturan Ujian */}
          <fieldset className={fieldsetClass}>
            <div className="flex items-center gap-2 mb-5 border-b pb-2 border-gray-200">
              <FaCogs className="text-blue-600 text-xl" />
              <h3 className="text-lg font-bold text-gray-800">
                Pengaturan Ujian
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>Keterangan Ujian</label>
                <input
                  type="text"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div className="relative">
                <label className={labelClass}>
                  Tanggal Mulai (Akses Dibuka)
                </label>
                <div className="absolute inset-y-0 left-3 flex items-center pt-6 z-10">
                  <FaCalendarAlt className="text-gray-400" />
                </div>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className={`${inputClass} pl-10`}
                  required
                />
              </div>

              <div className="relative">
                <label className={labelClass}>
                  Tanggal Berakhir (Akses Ditutup)
                </label>
                <div className="absolute inset-y-0 left-3 flex items-center pt-6 z-10">
                  <FaCalendarAlt className="text-gray-400" />
                </div>
                <input
                  type="date"
                  value={tanggalBerakhir}
                  onChange={(e) => setTanggalBerakhir(e.target.value)}
                  className={`${inputClass} pl-10`}
                  required
                />
              </div>

              <div className="relative">
                <label className={labelClass}>Jam Mulai WIB (Akses Dibuka)</label>
                <div className="absolute inset-y-0 left-3 flex items-center pt-6 z-10">
                  <FaClock className="text-gray-400" />
                </div>
                <input
                  type="time"
                  value={jamMulai}
                  onChange={(e) => setJamMulai(e.target.value)}
                  className={`${inputClass} pl-10`}
                  required
                />
              </div>

              <div className="relative">
                <label className={labelClass}>
                  Jam Berakhir WIB (Akses Ditutup)
                </label>
                <div className="absolute inset-y-0 left-3 flex items-center pt-6 z-10">
                  <FaClock className="text-gray-400" />
                </div>
                <input
                  type="time"
                  value={jamBerakhir}
                  onChange={(e) => setJamBerakhir(e.target.value)}
                  className={`${inputClass} pl-10`}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Durasi Pengerjaan (Menit)</label>
                <input
                  type="number"
                  min="1"
                  value={durasi}
                  onChange={(e) => setDurasi(e.target.value)}
                  className={inputClass}
                  placeholder="Contoh: 90"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ini adalah waktu hitung mundur yang akan didapat peserta
                  setelah menekan tombol "Mulai".
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex flex-col gap-3">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={acakSoal}
                    onChange={() => setAcakSoal(!acakSoal)}
                    className="h-4 w-4"
                  />
                  Acak urutan soal untuk setiap peserta
                </label>

                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={acakOpsi}
                    onChange={() => setAcakOpsi(!acakOpsi)}
                    className="h-4 w-4"
                  />
                  Acak jawaban pilihan ganda untuk setiap peserta
                </label>
              </div>
            </div>
          </fieldset>

          {/* Soal */}
          {daftarSoal.map((soal, index) => (
            <fieldset key={soal.id} className={fieldsetClass}>
              <div className="flex justify-between items-center mb-5 border-b pb-2 border-gray-200">
                <div className="flex items-center gap-2">
                  <FaListAlt className="text-green-600 text-xl" />
                  <h3 className="text-lg font-bold text-gray-800">
                    Soal {index + 1}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => handleHapusSoal(soal.id)}
                  className="text-gray-400 hover:text-red-500 transition"
                  disabled={daftarSoal.length <= 1}
                >
                  <FaTrash />
                </button>
              </div>

              {/* Upload Gambar */}
              <div className="mb-4">
                <label className={labelClass}>
                  <FaImage className="inline mr-1 text-blue-500" />
                  Gambar Soal (opsional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleFileChange(soal.id, e.target.files[0])
                  }
                  className="block text-sm border border-gray-300 rounded-md p-1 w-full"
                />
                {soal.gambarPreview && (
                  <div className="mt-2">
                    <img
                      src={soal.gambarPreview}
                      alt="Preview"
                      className="rounded-md border w-48 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => handleHapusGambar(soal.id)}
                      className="mt-2 text-sm text-red-600 hover:underline"
                    >
                      Hapus Gambar
                    </button>
                  </div>
                )}
              </div>

              {/* GRID SOAL & BOBOT */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Tipe Soal</label>
                  <select
                    value={soal.tipeSoal}
                    onChange={(e) =>
                      handleSoalChange(soal.id, "tipeSoal", e.target.value)
                    }
                    className={inputClass}
                  >
                    <option value="pilihanGanda">Pilihan Ganda</option>
                    <option value="teksSingkat">
                      Teks Singkat (Auto-Nilai)
                    </option>
                    <option value="soalDokumen">
                      Soal Dokumen (Jawaban Upload File)
                    </option>
                    <option value="esai">Esai (Nilai Manual)</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Bobot Nilai</label>
                  <input
                    type="number"
                    min="0"
                    value={soal.bobot || 1}
                    onChange={(e) =>
                      handleSoalChange(soal.id, "bobot", e.target.value)
                    }
                    className={inputClass}
                    placeholder="Default: 1"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className={labelClass}>Pertanyaan</label>
                  <textarea
                    value={soal.soalText}
                    onChange={(e) =>
                      handleSoalChange(soal.id, "soalText", e.target.value)
                    }
                    className={textAreaClass}
                    required
                  />
                </div>
              </div>

              {/* UI KONFIGURASI SOAL DOKUMEN */}
              {soal.tipeSoal === "soalDokumen" && (
                <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded-r-md mt-4 space-y-4">
                  <div className="flex mb-2">
                    <FaCheckCircle className="h-5 w-5 text-purple-400 mt-0.5" />
                    <p className="ml-3 text-sm text-purple-700 font-semibold">
                      Konfigurasi Upload Dokumen Peserta
                    </p>
                  </div>

                  {/* 1. PILIH TIPE FILE */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipe File yang Diizinkan:
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {FILE_TYPE_GROUPS.map((type) => (
                        <label
                          key={type.label}
                          className="flex items-center space-x-2 text-sm bg-white p-2 rounded border border-gray-200"
                        >
                          <input
                            type="checkbox"
                            checked={(soal.allowedTypes || []).some((ext) =>
                              type.exts.includes(ext)
                            )}
                            onChange={() =>
                              handleAllowedTypeChange(soal.id, type.exts)
                            }
                            className="rounded text-purple-600 focus:ring-purple-500"
                          />
                          <span>{type.label}</span>
                        </label>
                      ))}
                    </div>
                    {(soal.allowedTypes || []).length === 0 && (
                      <p className="text-xs text-orange-600 mt-1">
                        * Jika tidak ada yang dipilih, semua jenis file akan
                        diizinkan (Tidak disarankan).
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 2. MAX SIZE */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Maksimal Ukuran File (MB)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={soal.maxSize || 5}
                        onChange={(e) =>
                          handleSoalChange(soal.id, "maxSize", e.target.value)
                        }
                        className={inputClass}
                      />
                      <p className="text-xs text-gray-500">
                        Contoh: 5 untuk 5 MB.
                      </p>
                    </div>

                    {/* 3. MAX JUMLAH FILE */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Maksimal Jumlah File Upload
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={soal.maxCount || 1}
                        onChange={(e) =>
                          handleSoalChange(soal.id, "maxCount", e.target.value)
                        }
                        className={inputClass}
                      />
                      <p className="text-xs text-gray-500">
                        Berapa file yang boleh diupload peserta untuk soal ini.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Pilihan PG */}
              {soal.tipeSoal === "pilihanGanda" && (
                <div className="mt-5 border-t border-gray-200 pt-4">
                  <h4 className="text-base font-semibold text-gray-800 mb-2">
                    Pilihan Jawaban{" "}
                    <span className="text-xs text-gray-500 ml-1">
                      (Pilih satu sebagai jawaban benar)
                    </span>
                  </h4>

                  {soal.pilihan.map((p, i) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 bg-gray-50 rounded-md p-2.5 mb-2 hover:bg-gray-100 transition"
                    >
                      <input
                        type="radio"
                        checked={soal.kunciJawaban === p.id}
                        onChange={() =>
                          handleKunciJawabanChange(soal.id, p.id)
                        }
                        className="h-4 w-4 text-blue-600"
                      />
                      <input
                        type="text"
                        placeholder={`Pilihan ${i + 1}`}
                        value={p.text}
                        onChange={(e) =>
                          handlePilihanChange(soal.id, p.id, e.target.value)
                        }
                        className={`${inputClass} flex-1`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => handleHapusPilihan(soal.id, p.id)}
                        className="text-gray-400 hover:text-red-500 transition"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => handleTambahPilihan(soal.id)}
                    className="mt-2 flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition"
                  >
                    <FaPlus className="w-4 h-4" />
                    Tambah Pilihan
                  </button>
                </div>
              )}

              {/* Kunci Jawaban Teks Singkat */}
              {soal.tipeSoal === "teksSingkat" && (
                <div className="mt-5 border-t border-gray-200 pt-4">
                  <h4 className="text-base font-semibold text-gray-800 mb-2">
                    Kunci Jawaban
                  </h4>
                  <input
                    type="text"
                    placeholder="Masukkan jawaban singkat yang benar (case-insensitive)"
                    value={soal.kunciJawabanText}
                    onChange={(e) =>
                      handleSoalChange(
                        soal.id,
                        "kunciJawabanText",
                        e.target.value
                      )
                    }
                    className={inputClass}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Gunakan tanda <b>,</b> (tanda koma) untuk memisahkan jika
                    ada lebih dari satu jawaban benar.
                    <br />
                    Contoh: <b>2 , dua , 2 (dua)</b>
                  </p>
                </div>
              )}
            </fieldset>
          ))}

          {/* Tombol Tambah Soal */}
          <div className="flex justify-start">
            <button
              type="button"
              onClick={handleTambahSoal}
              className="flex items-center gap-2 py-2.5 px-4 rounded-md bg-green-600 text-white font-semibold shadow hover:bg-green-700 transition"
            >
              <FaPlus className="w-4 h-4" />
              Tambah Soal Baru
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSoal;