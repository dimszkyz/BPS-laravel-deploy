// File: src/admin/TambahSoal.jsx
import React, { useState, useRef } from "react";
import {
  FaCalendarAlt,
  FaClock,
  FaPlus,
  FaSave,
  FaCheckCircle,
  FaTrash,
  FaCogs,
  FaListAlt,
  FaImage,
  FaFileExcel,
  FaDownload,
  FaUpload,
  FaExclamationCircle, // Icon untuk error
  FaTimes, // Icon untuk tutup alert
} from "react-icons/fa";

// Import logika Excel dari file baru
import {
  downloadWorkbook,
  buildTemplateWorkbook,
  generateWorkbookFromState,
  parseWorkbookToState,
} from "./TemplateExcel";

const FILE_TYPE_GROUPS = [
  { label: "PDF (.pdf)", exts: [".pdf"] },
  { label: "Word (.doc, .docx)", exts: [".doc", ".docx"] },
  { label: "Excel (.xls, .xlsx)", exts: [".xls", ".xlsx"] },
  { label: "Gambar (JPG/PNG)", exts: [".jpg", ".jpeg", ".png"] },
  { label: "ZIP/RAR", exts: [".zip", ".rar"] },
];

const getAdminToken = () => {
  const token = sessionStorage.getItem("adminToken");
  if (!token) throw new Error("Token tidak ditemukan.");
  return token;
};

const TambahSoal = () => {
  const [keterangan, setKeterangan] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [tanggalBerakhir, setTanggalBerakhir] = useState("");
  const [jamMulai, setJamMulai] = useState("");
  const [jamBerakhir, setJamBerakhir] = useState("");
  const [durasi, setDurasi] = useState("");

  const [acakSoal, setAcakSoal] = useState(false);
  const [acakOpsi, setAcakOpsi] = useState(false);

  const [successMessage, setSuccessMessage] = useState(""); // Untuk banner biasa
  const [errorMessage, setErrorMessage] = useState("");
  
  // State Khusus untuk Popup "Ujian Berhasil Disimpan"
  const [showSaveSuccessPopup, setShowSaveSuccessPopup] = useState(false);
  const [importReport, setImportReport] = useState(null); 
  const [showImportReportModal, setShowImportReportModal] = useState(false);

  const [daftarSoal, setDaftarSoal] = useState([
    {
      id: 1,
      tipeSoal: "pilihanGanda",
      bobot: 1, // Default bobot
      soalText: "",
      gambar: null,
      gambarPreview: null,
      pilihan: [
        { id: 1, text: "" },
        { id: 2, text: "" },
      ],
      kunciJawaban: 1,
      kunciJawabanText: "",
      allowedTypes: [],
      maxSize: 5,
      maxCount: 1,
    },
  ]);

  const excelInputRef = useRef(null);

  // --- Helper Show Alert & Scroll ---
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showError = (msg) => {
    setErrorMessage(msg);
    setSuccessMessage(""); 
    scrollToTop();
  };

  // Helper untuk notifikasi banner biasa (selain simpan ujian)
  const showSuccessBanner = (msg) => {
    setSuccessMessage(msg);
    setErrorMessage("");
    scrollToTop();
    setTimeout(() => setSuccessMessage(""), 5000);
  };

  // --- Logic State Management Form ---

  const handleFileChange = (soalId, file) => {
    const updated = daftarSoal.map((s) => {
      if (s.id === soalId) {
        return {
          ...s,
          gambar: file,
          gambarPreview: file ? URL.createObjectURL(file) : null,
        };
      }
      return s;
    });
    setDaftarSoal(updated);
  };

  const handleTambahSoal = () => {
    const newId = daftarSoal.length + 1;
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
          { id: 1, text: "" },
          { id: 2, text: "" },
        ],
        kunciJawaban: 1,
        kunciJawabanText: "",
        allowedTypes: [],
        maxSize: 5,
        maxCount: 1,
      },
    ]);
  };

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

  const handleHapusSoal = (id) => {
    if (daftarSoal.length <= 1) {
      showError("Minimal harus ada satu soal.");
      return;
    }
    setDaftarSoal(daftarSoal.filter((s) => s.id !== id));
  };

  const handleSoalChange = (id, field, value) => {
    const updated = daftarSoal.map((s) =>
      s.id === id ? { ...s, [field]: value } : s
    );
    setDaftarSoal(updated);
  };

  const handleTambahPilihan = (soalId) => {
    setDaftarSoal((prev) =>
      prev.map((s) =>
        s.id === soalId
          ? {
              ...s,
              pilihan: [...s.pilihan, { id: s.pilihan.length + 1, text: "" }],
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
            showError("Minimal harus ada 2 pilihan.");
            return s;
          }
          const newPilihan = s.pilihan.filter((p) => p.id !== pilihanId);
          return {
            ...s,
            pilihan: newPilihan,
            kunciJawaban:
              s.kunciJawaban === pilihanId
                ? newPilihan[0]?.id || 0
                : s.kunciJawaban,
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

  // ---------- Excel Handlers ----------
  const handleDownloadTemplate = () => {
    const wb = buildTemplateWorkbook();
    downloadWorkbook(wb, "template_import_ujian_dan_soal.xlsx");
  };

  const handleExportSoalExcel = () => {
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
    downloadWorkbook(wb, "export_ujian_dan_soal.xlsx");
  };

  const handleImportExcelFile = async (file) => {
    setErrorMessage("");
    setSuccessMessage("");
    setImportReport(null);
    
    try {
      // Destructure errors dari result
      const { settings, soalList, errors } = await parseWorkbookToState(file);
      
      let importedCount = 0;

      // 1. Update Settings jika ada
      if (settings) {
        setKeterangan(settings.keterangan);
        setTanggal(settings.tanggal);
        setTanggalBerakhir(settings.tanggalBerakhir);
        setJamMulai(settings.jamMulai);
        setJamBerakhir(settings.jamBerakhir);
        setDurasi(settings.durasi);
        setAcakSoal(settings.acakSoal);
        setAcakOpsi(settings.acakOpsi);
      }

      // 2. Update Soal List jika ada
      if (soalList && soalList.length > 0) {
        setDaftarSoal(soalList);
        importedCount = soalList.length;
      }

      // 3. Logic Pelaporan
      const hasErrors = errors && errors.length > 0;
      
      if (importedCount > 0 && !hasErrors) {
        // SUKSES SEMPURNA
        showSuccessBanner(`Berhasil import ${importedCount} soal dari Excel.`);
      } else if (importedCount === 0 && hasErrors) {
        // GAGAL TOTAL
        setImportReport({ success: 0, errors });
        setShowImportReportModal(true);
        // showError("Gagal import. Silakan cek laporan kesalahan.");
      } else if (importedCount > 0 && hasErrors) {
        // SUKSES SEBAGIAN (PARTIAL)
        setImportReport({ success: importedCount, errors });
        setShowImportReportModal(true);
      } else {
        // FILE KOSONG / TIDAK JELAS
        showError("File Excel tidak berisi data soal yang terbaca.");
      }

    } catch (err) {
      console.error(err);
      showError("Gagal membaca file Excel. Pastikan formatnya sesuai template.");
    }
  };

  const handleClickImport = () => {
    if (excelInputRef.current) excelInputRef.current.click();
  };

  // === SUBMIT TO SERVER ===
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!jamMulai || !jamBerakhir) {
      showError("Jam mulai dan jam berakhir wajib diisi.");
      return;
    }
    if (!tanggalBerakhir) {
      showError("Tanggal berakhir wajib diisi.");
      return;
    }
    if (!durasi || parseInt(durasi, 10) <= 0) {
      showError("Durasi pengerjaan wajib diisi dan harus lebih dari 0.");
      return;
    }

    const soalList = daftarSoal.map((s) => ({
      tipeSoal: s.tipeSoal,
      bobot: Number.isNaN(parseInt(s.bobot, 10))
        ? 1
        : parseInt(s.bobot, 10),
      soalText: s.soalText,
      pilihan:
        s.tipeSoal === "pilihanGanda" ? s.pilihan.map((p) => p.text) : [],
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

    daftarSoal.forEach((s, i) => {
      if (s.gambar) formData.append(`gambar_${i}`, s.gambar);
    });

    try {
      const token = getAdminToken();
      const res = await fetch("https://kompeta.web.bps.go.id/api/ujian", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal menyimpan ujian");

      // Tampilkan POPUP Sukses (Hanya untuk Ujian Berhasil Disimpan)
      setShowSaveSuccessPopup(true);

      // Reset form
      setKeterangan("");
      setTanggal("");
      setTanggalBerakhir("");
      setJamMulai("");
      setJamBerakhir("");
      setDurasi("");
      setAcakSoal(false);
      setAcakOpsi(false);

      setDaftarSoal([
        {
          id: 1,
          tipeSoal: "pilihanGanda",
          bobot: 1,
          soalText: "",
          gambar: null,
          gambarPreview: null,
          pilihan: [
            { id: 1, text: "" },
            { id: 2, text: "" },
          ],
          kunciJawaban: 1,
          kunciJawabanText: "",
          allowedTypes: [],
          maxSize: 5,
          maxCount: 1,
        },
      ]);
    } catch (err) {
      console.error("Error:", err);
      showError("Terjadi kesalahan: " + err.message);
    }
  };

  const labelClass =
    "block text-sm font-semibold text-gray-700 mb-1 tracking-wide";
  const inputClass =
    "block w-full rounded-md border border-gray-300 bg-white shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm py-2.5 px-3";
  const textAreaClass =
    "block w-full rounded-md border border-gray-300 bg-white shadow-sm focus:border-blue-500 focus:ring-blue-200 focus:ring-opacity-50 text-sm p-3 min-h-[100px]";
  const fieldsetClass =
    "bg-white rounded-xl border border-gray-100 shadow-sm p-6 transition duration-200";

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      
      {/* STYLE UNTUK ANIMASI POPUP & CHECKLIST */}
      <style>{`
        @keyframes scaleUp {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        /* Animasi Rotasi Lingkaran */
        @keyframes rotate-check {
          0% { transform: rotate(-90deg); opacity: 0; }
          100% { transform: rotate(0deg); opacity: 1; }
        }
        /* Animasi Centang Menggambar */
        @keyframes draw-check {
          0% { stroke-dashoffset: 50; }
          100% { stroke-dashoffset: 0; }
        }

        .animate-scale-up {
          animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        
        .circle-path {
            transform-origin: center;
            animation: rotate-check 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
        }
        .checkmark-path {
            stroke-dasharray: 50;
            stroke-dashoffset: 50;
            animation: draw-check 0.4s cubic-bezier(0.65, 0, 0.45, 1) 0.3s forwards;
        }
      `}</style>

      {/* =================================================================
          POPUP MOVED TO TOP LEVEL & INCREASED Z-INDEX FOR FOOTER COVERAGE
      ================================================================== */}
      {showSaveSuccessPopup && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-[2px] animate-fade-in p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full flex flex-col items-center text-center animate-scale-up relative">
            
            {/* Animated Checkmark SVG */}
            <div className="w-24 h-24 mb-4 flex items-center justify-center">
                <svg viewBox="0 0 52 52" className="w-full h-full text-green-500 fill-none stroke-current stroke-[3]">
                    <circle cx="26" cy="26" r="25" className="circle-path" />
                    <path 
                        d="M14.1 27.2l7.1 7.2 16.7-16.8" 
                        className="checkmark-path"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Berhasil!</h2>
            <p className="text-gray-600 mb-6">Ujian Berhasil Disimpan</p>

            <button
              type="button"
              onClick={() => setShowSaveSuccessPopup(false)}
              className="px-8 py-2.5 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition active:scale-95"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* INPUT FILE HIDDEN */}
      <input
        ref={excelInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleImportExcelFile(f);
          e.target.value = "";
        }}
      />

      {/* ===========================
          NAVBAR (Sticky Top)
      ============================ */}
      <div className="bg-white shadow-sm border-b border-gray-300 py-4 pl-14 pr-4 md:px-8 md:py-5 sticky top-0 z-50 flex flex-wrap gap-y-3 justify-between items-center transition-all">
        {/* JUDUL HALAMAN */}
        <h2 className="text-xl md:text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <span className="hidden md:inline-block text-blue-600 text-2xl">
            🧩
          </span>
          <span>Tambah Ujian</span>
        </h2>

        {/* TOMBOL AKSI */}
        <div className="hidden md:flex gap-2 flex-wrap items-center justify-end">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 py-2 px-3 lg:px-4 rounded-md bg-emerald-600 text-white font-semibold shadow hover:bg-emerald-700 transition text-xs lg:text-sm whitespace-nowrap"
          >
            <FaDownload />
            <span className="hidden lg:inline">Template</span> Excel
          </button>

          <button
            type="button"
            onClick={handleExportSoalExcel}
            className="flex items-center gap-2 py-2 px-3 lg:px-4 rounded-md bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 transition text-xs lg:text-sm whitespace-nowrap"
          >
            <FaFileExcel />
            Export
          </button>

          <button
            type="button"
            onClick={handleClickImport}
            className="flex items-center gap-2 py-2 px-3 lg:px-4 rounded-md bg-orange-600 text-white font-semibold shadow hover:bg-orange-700 transition text-xs lg:text-sm whitespace-nowrap"
          >
            <FaUpload />
            Import
          </button>

          <button
            type="submit"
            form="form-ujian"
            className="flex items-center gap-2 py-2 px-4 lg:px-5 rounded-md bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition text-xs lg:text-sm whitespace-nowrap"
          >
            <FaSave />
            Simpan
          </button>
        </div>
      </div>

      {/* ===========================
          KONTEN UTAMA
      ============================ */}
      <div className="p-4 md:p-10">
        
        {/* MENU AKSI MOBILE */}
        <div className="md:hidden mb-6 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-100 pb-2">
            Menu Aksi Cepat
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-lg bg-emerald-50 text-emerald-700 font-medium hover:bg-emerald-100 transition text-xs border border-emerald-100"
            >
              <FaDownload className="w-5 h-5 mb-1" />
              Template Excel
            </button>

            <button
              type="button"
              onClick={handleExportSoalExcel}
              className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-lg bg-indigo-50 text-indigo-700 font-medium hover:bg-indigo-100 transition text-xs border border-indigo-100"
            >
              <FaFileExcel className="w-5 h-5 mb-1" />
              Export Ujian
            </button>

            <button
              type="button"
              onClick={handleClickImport}
              className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-lg bg-orange-50 text-orange-700 font-medium hover:bg-orange-100 transition text-xs border border-orange-100"
            >
              <FaUpload className="w-5 h-5 mb-1" />
              Import Excel
            </button>

            <button
              type="submit"
              form="form-ujian"
              className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-lg bg-blue-600 text-white font-medium shadow hover:bg-blue-700 transition text-xs"
            >
              <FaSave className="w-5 h-5 mb-1" />
              Simpan Soal
            </button>
          </div>
        </div>

        {/* FORM UJIAN */}
        <form
          id="form-ujian"
          onSubmit={handleSubmit}
          className="space-y-8 max-w-5xl mx-auto"
        >
          
          {/* ----- BANNER SUCCESS (Untuk Import Excel, dll - Sisanya Tetap Sama) ----- */}
          {successMessage && !showSaveSuccessPopup && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md shadow-sm mb-6 flex items-start justify-between animate-fade-in">
              <div className="flex items-start gap-3">
                <FaCheckCircle className="text-green-500 text-xl mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-green-800 font-bold text-sm">Berhasil</h4>
                  <p className="text-green-700 text-sm mt-1">{successMessage}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSuccessMessage("")}
                className="text-green-400 hover:text-green-600 transition"
              >
                <FaTimes />
              </button>
            </div>
          )}

          {/* ----- ALERT / BANNER ERROR DISINI (TETAP SEPERTI BIASA) ----- */}
          {errorMessage && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm mb-6 flex items-start justify-between animate-fade-in">
              <div className="flex items-start gap-3">
                <FaExclamationCircle className="text-red-500 text-xl mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-red-800 font-bold text-sm">Terjadi Kesalahan / Perhatian</h4>
                  <p className="text-red-700 text-sm mt-1">{errorMessage}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage("")}
                className="text-red-400 hover:text-red-600 transition"
              >
                <FaTimes />
              </button>
            </div>
          )}

          {/* PENGATURAN UJIAN */}
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
                  Acak soal pilihan ganda untuk setiap peserta
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

          {/* DAFTAR SOAL */}
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
                  <img
                    src={soal.gambarPreview}
                    alt="Preview"
                    className="mt-2 rounded-md border w-48 shadow-sm"
                  />
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
                    <option value="esai">Esai (Nilai Manual)</option>
                    <option value="soalDokumen">
                      Soal Dokumen (Upload File)
                    </option>
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
                    placeholder="Masukkan teks pertanyaan..."
                    required
                  />
                </div>
              </div>

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
                    Gunakan tanda <b>,</b> untuk memisahkan jika ada lebih dari
                    satu jawaban benar.
                    <br />
                    Contoh: <b>2 , dua , 2 (dua)</b>
                  </p>
                </div>
              )}

              {soal.tipeSoal === "esai" && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-md mt-4">
                  <div className="flex">
                    <FaCheckCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                    <p className="ml-3 text-sm text-blue-700">
                      Untuk soal esai, jawaban akan dinilai manual oleh
                      pengajar.
                    </p>
                  </div>
                </div>
              )}

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
                      {FILE_TYPE_GROUPS.map((group) => {
                        const current = soal.allowedTypes || [];
                        const checked = group.exts.some((ext) =>
                          current.includes(ext)
                        );
                        return (
                          <label
                            key={group.label}
                            className="flex items-center space-x-2 text-sm bg-white p-2 rounded border border-gray-200"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                handleAllowedTypeChange(soal.id, group.exts)
                              }
                              className="rounded text-purple-600 focus:ring-purple-500"
                            />
                            <span>{group.label}</span>
                          </label>
                        );
                      })}
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
            </fieldset>
          ))}

          <div className="flex justify-between items-center pb-8">
            <button
              type="button"
              onClick={handleTambahSoal}
              className="flex items-center gap-2 py-2.5 px-4 rounded-md bg-green-600 text-white font-semibold shadow hover:bg-green-700 transition"
            >
              <FaPlus className="w-4 h-4" />
              Tambah Soal Lagi
            </button>
          </div>
        </form>
      </div>
      {/* =========================================
          POPUP IMPORT REPORT (ERROR LOG)
      ========================================== */}
      {showImportReportModal && importReport && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-scale-up overflow-hidden">
            
            {/* Header Modal */}
            <div className="bg-gray-100 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FaFileExcel className="text-green-600" />
                Laporan Import Excel
              </h3>
              <button 
                onClick={() => setShowImportReportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>

            {/* Body Scrollable */}
            <div className="p-6 overflow-y-auto">
              
              {/* Ringkasan Status */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <h4 className="text-2xl font-bold text-green-700">{importReport.success}</h4>
                  <p className="text-sm text-green-800">Soal Berhasil Masuk</p>
                </div>
                <div className="flex-1 bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <h4 className="text-2xl font-bold text-red-700">{importReport.errors.length}</h4>
                  <p className="text-sm text-red-800">Masalah Ditemukan</p>
                </div>
              </div>

              {/* List Error */}
              {importReport.errors.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700 mb-2">Detail Kesalahan:</h4>
                  {importReport.errors.map((err, idx) => (
                    <div key={idx} className="bg-red-50 border-l-4 border-red-500 p-3 rounded text-sm">
                      <div className="flex justify-between font-semibold text-red-800 mb-1">
                        <span>Sheet: {err.sheet}</span>
                        <span>Baris Excel: {err.row}</span>
                      </div>
                      <p className="text-gray-700">{err.msg}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FaCheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p>Semua data valid!</p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 text-right">
              <button
                type="button"
                onClick={() => setShowImportReportModal(false)}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                Tutup & Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TambahSoal;