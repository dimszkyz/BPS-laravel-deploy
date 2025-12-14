// File: src/admin/DaftarSoal.jsx
import React, { useEffect, useState } from "react";
import {
  FaEdit,
  FaTrash,
  FaListUl,
  FaSyncAlt,
  FaCopy,
  FaExclamationTriangle,
  FaCheckCircle,
  FaCalendarAlt,
  FaClock,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaTimesCircle, // Icon baru untuk error
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const API_URL = "https://kompeta.web.bps.go.id";

// ===============================================
// ▼▼▼ KOMPONEN MODAL KONFIRMASI ▼▼▼
// ===============================================
const KonfirmasiModal = ({ show, message, onCancel, onConfirm }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px]">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center gap-3 mb-4">
          <FaExclamationTriangle className="text-yellow-500 text-2xl" />
          <h3 className="text-lg font-semibold text-gray-800">Konfirmasi</h3>
        </div>

        <p className="text-gray-700 mb-6 text-sm">{message}</p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 text-sm font-semibold hover:bg-gray-300 transition"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
// ===============================================
// ▲▲▲ AKHIR KOMPONEN MODAL ▲▲▲
// ===============================================

const DaftarSoal = () => {
  const [daftarUjian, setDaftarUjian] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // state untuk modal konfirmasi
  const [modalState, setModalState] = useState({
    show: false,
    message: "",
    onConfirm: () => {},
  });

  // toast sukses & error
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // SEARCH & PAGINATION
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // default page size menyesuaikan lebar layar SAAT PERTAMA KALI load
  const getInitialPageSize = () => {
    if (typeof window === "undefined") return 10;
    const width = window.innerWidth;
    if (width < 640) return 5; // mobile
    if (width < 1024) return 10; // tablet
    return 10; // desktop
  };
  const [pageSize, setPageSize] = useState(getInitialPageSize);

  // =============================
  // Helper tanggal
  // =============================
  const pad2 = (n) => String(n).padStart(2, "0");

  const toLocalDateOnly = (val) => {
    const d = new Date(val);
    if (!isNaN(d)) {
      return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(
        d.getDate()
      )}`;
    }
    const s = String(val || "");
    return s.includes("T") ? s.slice(0, 10) : s;
  };

  const formatTanggal = (tgl) => {
    if (!tgl) return "-";
    const [y, m, d] = toLocalDateOnly(tgl).split("-");
    if (!y || !m || !d) return tgl;
    return `${d}-${m}-${y}`;
  };

  // =============================
  // Helper Error Handler
  // =============================
  const handleError = (err) => {
    console.error("Error Fetch Ujian:", err);

    // Jika akun dinonaktifkan, biarkan main.jsx yang handle
    if (err.message === "Akun Anda telah dinonaktifkan.") return;

    // --- MODIFIKASI: JANGAN LANGSUNG LEMPAR DULU ---
    // Cukup tampilkan pesan error, jangan hapus storage otomatis
    // Kecuali Anda yakin 100% token benar-benar mati.
    
    if (
      err.message.includes("Token tidak valid") ||
      err.message.includes("Sesi telah berakhir")
    ) {
       // Opsional: Tampilkan notifikasi "Sesi habis" tapi jangan navigate paksa dulu
       // untuk debugging. Jika sudah fix, boleh di-uncomment.
       
       // sessionStorage.removeItem("adminToken");
       // sessionStorage.removeItem("adminData");
       // navigate("/admin/login");
       
       setErrorMessage("Sesi backend menolak token. Coba refresh halaman.");
       return;
    }

    setErrorMessage(err.message || "Terjadi kesalahan.");
    setTimeout(() => setErrorMessage(""), 4000);
  };
  // =============================
  // Ambil semua ujian
  // =============================
  const fetchUjian = async () => {
    try {
      setLoading(true);
      setErrorMessage(""); // Reset error lama

      const token = sessionStorage.getItem("adminToken");
      if (!token) throw new Error("Token tidak ditemukan. Silakan login ulang.");

      const res = await fetch(`${API_URL}/api/ujian`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal memuat daftar ujian.");
      }

      const safeArray = Array.isArray(data) ? data : [];
      const sortedData = [...safeArray].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );

      setDaftarUjian(sortedData);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // ▼▼▼ FUNGSI MODAL & AKSI ▼▼▼
  // =============================================
  const handleCloseModal = () => {
    setModalState({ show: false, message: "", onConfirm: () => {} });
  };

  const handleConfirmModal = () => {
    modalState.onConfirm();
    handleCloseModal();
  };

  // --- LOGIKA HAPUS ---
  const prosesHapus = async (id) => {
    try {
      const token = sessionStorage.getItem("adminToken");
      if (!token) throw new Error("Token tidak ditemukan.");

      const res = await fetch(`${API_URL}/api/ujian/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal hapus ujian");

      setSuccessMessage("Ujian berhasil dihapus");
      setTimeout(() => setSuccessMessage(""), 3000);

      fetchUjian();
    } catch (err) {
      handleError(err);
    }
  };

  const handleDelete = (id) => {
    setModalState({
      show: true,
      message: "Yakin ingin menghapus ujian ini?",
      onConfirm: () => prosesHapus(id),
    });
  };

  // --- LOGIKA SALIN ---
  const prosesSalin = async (ujian) => {
    try {
      const token = sessionStorage.getItem("adminToken");
      if (!token) throw new Error("Token tidak ditemukan. Silakan login ulang.");

      const resDetail = await fetch(`${API_URL}/api/ujian/${ujian.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const detailData = await resDetail.json();
      if (!resDetail.ok) {
        throw new Error(detailData.message || "Gagal memuat detail ujian.");
      }

      const soalList =
        Array.isArray(detailData.soalList) && detailData.soalList.length > 0
          ? detailData.soalList.map((soal) => ({
              tipeSoal: soal.tipeSoal,
              bobot: soal.bobot || 1,
              soalText: soal.soalText,
              gambar: soal.gambar || null,
              pilihan:
                soal.tipeSoal === "pilihanGanda"
                  ? soal.pilihan.map((p) => p.text)
                  : [],
              kunciJawabanText:
                soal.tipeSoal === "pilihanGanda"
                  ? soal.pilihan.find((p) => p.isCorrect)?.text || ""
                  : soal.tipeSoal === "teksSingkat"
                  ? soal.pilihan.find((p) => p.isCorrect)?.text || ""
                  : "",
              allowedTypes: soal.allowedTypes || [],
              maxSize: soal.maxSize || 5,
              maxCount: soal.maxCount || 1,
            }))
          : [
              {
                tipeSoal: "pilihanGanda",
                soalText: "Salinan pertanyaan baru",
                gambar: null,
                pilihan: ["Pilihan 1", "Pilihan 2"],
                kunciJawabanText: "Pilihan 1",
              },
            ];

      let localDate = new Date().toISOString().split("T")[0];
      if (detailData.tanggal && !isNaN(new Date(detailData.tanggal))) {
        const original = new Date(detailData.tanggal);
        localDate = new Date(
          original.getTime() - original.getTimezoneOffset() * 60000
        )
          .toISOString()
          .split("T")[0];
      }

      const localDateBerakhir = detailData.tanggal_berakhir
        ? toLocalDateOnly(detailData.tanggal_berakhir)
        : localDate;

      const stripSalinan = (txt) =>
        txt.replace(/\s*\(Salinan\)\s*$/i, "").trim();
      const bumpOrOne = (txt) => {
        const m = txt.match(/\((\d+)\)\s*$/);
        if (m) {
          const n = parseInt(m[1], 10) + 1;
          return txt.replace(/\(\d+\)\s*$/, `(${n})`);
        }
        return `${txt} (1)`;
      };

      const newKeterangan = bumpOrOne(
        stripSalinan(detailData.keterangan || "")
      );

      const jamMulaiBaru = detailData.jam_mulai || "08:00";
      const jamBerakhirBaru = detailData.jam_berakhir || "09:00";
      const durasiBaru = detailData.durasi || 60;
      const acakSoalBaru = detailData.acak_soal || false;

      const acakOpsiBaru =
        detailData.acak_opsi ??
        detailData.acakOpsi ??
        (detailData.acak_opsi === 1 ? true : false) ??
        false;

      const payload = {
        keterangan: newKeterangan,
        tanggal: localDate,
        tanggalBerakhir: localDateBerakhir,
        jamMulai: jamMulaiBaru,
        jamBerakhir: jamBerakhirBaru,
        durasi: durasiBaru,
        acakSoal: acakSoalBaru,
        acakOpsi: acakOpsiBaru,
        soalList,
      };

      const formData = new FormData();
      formData.append("data", JSON.stringify(payload));

      const resCopy = await fetch(`${API_URL}/api/ujian`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const copyResult = await resCopy.json();
      if (!resCopy.ok) {
        throw new Error(copyResult.message || "Gagal menyimpan salinan ujian");
      }

      setSuccessMessage("Ujian berhasil disalin!");
      setTimeout(() => setSuccessMessage(""), 3000);

      fetchUjian();
    } catch (err) {
      handleError(err);
    }
  };

  const handleSalin = (ujian) => {
    setModalState({
      show: true,
      message: "Yakin ingin menyalin ujian ini?",
      onConfirm: () => prosesSalin(ujian),
    });
  };

  // =============================================
  // ▲▲▲ AKHIR FUNGSI MODAL ▲▲▲
  // =============================================

  // Ambil data awal
  useEffect(() => {
    fetchUjian();
  }, []);

  // Reset halaman ketika daftar ujian / search / pageSize berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize, daftarUjian.length]);

  // Filter data berdasarkan pencarian
  const filteredUjian = daftarUjian.filter((u) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const ket = (u.keterangan || "").toLowerCase();
    const tglMulai = formatTanggal(u.tanggal).toLowerCase();
    const tglAkhir = formatTanggal(u.tanggal_berakhir).toLowerCase();
    return ket.includes(q) || tglMulai.includes(q) || tglAkhir.includes(q);
  });

  const totalItems = filteredUjian.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const startIndex = (currentPageSafe - 1) * pageSize;
  const currentItems = filteredUjian.slice(
    startIndex,
    startIndex + pageSize
  );

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handlePrevPage = () => handlePageChange(currentPageSafe - 1);
  const handleNextPage = () => handlePageChange(currentPageSafe + 1);

  const fromRow = totalItems === 0 ? 0 : startIndex + 1;
  const toRow =
    totalItems === 0 ? 0 : Math.min(startIndex + pageSize, totalItems);
  const shownCount = totalItems === 0 ? 0 : toRow - fromRow + 1;

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* MODAL KONFIRMASI */}
      <KonfirmasiModal
        show={modalState.show}
        message={modalState.message}
        onCancel={handleCloseModal}
        onConfirm={handleConfirmModal}
      />

      {/* NAVBAR STICKY */}
      <div className="bg-white shadow-sm border-b border-gray-300 py-4 pl-14 pr-4 md:px-8 md:py-5 flex justify-between items-center sticky top-0 z-50 transition-all">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-900 flex items-center gap-2">
          {/* ICON HANYA DI TABLET / DESKTOP */}
          <span className="hidden md:inline-flex">
            <FaListUl className="text-blue-600 w-5 h-5 md:w-6 md:h-6" />
          </span>
          <span>Daftar Ujian</span>
        </h2>

        <button
          onClick={fetchUjian}
          className="inline-flex items-center gap-2 px-3 py-1.5 md:px-3 md:py-2 bg-blue-600 text-white rounded-md text-xs md:text-sm font-medium hover:bg-blue-700 transition"
        >
          <FaSyncAlt className="w-3.5 h-3.5 md:w-4 md:h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* SEARCH + INFO + ROWS PER PAGE */}
      <div className="px-4 sm:px-6 md:px-10 pt-3 pb-2 bg-gray-50">
        <div className="sm:hidden space-y-2">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Pencarian
              </label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari keterangan / tanggal ujian..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>
            </div>
            <div className="flex flex-col w-20">
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Baris
              </label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="border border-gray-300 bg-white rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>

        <div className="hidden sm:block">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 md:max-w-3xl md:mx-auto lg:max-w-none lg:mx-0">
            <div className="w-full md:max-w-xs">
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Pencarian
              </label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari keterangan / tanggal ujian..."
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:gap-4 gap-2">
              <div className="hidden lg:flex items-center text-[11px] sm:text-xs md:text-sm text-gray-600">
                {totalItems === 0 ? (
                  <span>Tidak ada ujian yang cocok dengan pencarian.</span>
                ) : (
                  <>
                    <span className="inline-flex items-center justify-center w-4 h-4 mr-1 rounded-full border border-gray-300 text-[10px] text-gray-500">
                      i
                    </span>
                    <span>
                      Menampilkan{" "}
                      <span className="font-semibold">{shownCount}</span> dari{" "}
                      <span className="font-semibold">{totalItems}</span> ujian
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 text-[11px] sm:text-xs md:text-sm text-gray-700">
                <span>Baris:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="border border-gray-300 bg-white rounded-lg px-2 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT UTAMA */}
      <div className="px-4 sm:px-6 md:px-10 pb-4 md:pb-6">
        
        {/* --- NOTIFIKASI (POSISI BARU: DI ATAS KONTEN) --- */}
        <div className="mb-4 space-y-2">
          {successMessage && (
            <div className="flex items-center gap-3 bg-green-600 text-white px-4 py-3 rounded-lg shadow-sm text-sm animate-bounce-in w-full">
              <FaCheckCircle className="w-4 h-4 flex-shrink-0" />
              <span className="font-semibold">{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-3 bg-red-600 text-white px-4 py-3 rounded-lg shadow-sm text-sm animate-bounce-in w-full">
              <FaTimesCircle className="w-4 h-4 flex-shrink-0" />
              <span className="font-semibold">{errorMessage}</span>
            </div>
          )}
        </div>

        {loading ? (
          <p className="text-gray-600 text-center text-sm md:text-base">
            Memuat data...
          </p>
        ) : totalItems === 0 ? (
          <p className="text-gray-600 text-center text-sm md:text-base mt-4">
            {daftarUjian.length === 0
              ? "Belum ada ujian tersimpan."
              : "Ujian tidak ditemukan. Coba ubah kata kunci pencarian."}
          </p>
        ) : (
          <>
            {/* MOBILE: CARD LIST */}
            <div className="space-y-4 md:hidden mt-2">
              {currentItems.map((u, index) => (
                <div
                  key={u.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <p className="text-[11px] uppercase tracking-wide text-gray-400">
                        Ujian #{startIndex + index + 1}
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-gray-900 break-words">
                        {u.keterangan}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <FaCalendarAlt className="w-3.5 h-3.5 text-gray-400" />
                      <span>
                        {formatTanggal(u.tanggal)} &ndash;{" "}
                        {formatTanggal(u.tanggal_berakhir)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaClock className="w-3.5 h-3.5 text-gray-400" />
                      <span>
                        {(u.jam_mulai || "--:--") +
                          " – " +
                          (u.jam_berakhir || "--:--")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-500">
                        Durasi:
                      </span>
                      <span>{u.durasi ? `${u.durasi} menit` : "-"}</span>
                    </div>
                  </div>

                  <div className="pt-2 mt-1 border-t border-dashed border-gray-200">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => navigate(`/admin/edit-soal/${u.id}`)}
                        className="flex-1 min-w-[90px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition"
                      >
                        <FaEdit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleSalin(u)}
                        className="flex-1 min-w-[90px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition"
                      >
                        <FaCopy className="w-3.5 h-3.5" />
                        <span>Salin</span>
                      </button>

                      <button
                        onClick={() => handleDelete(u.id)}
                        className="flex-1 min-w-[90px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition"
                      >
                        <FaTrash className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* TABLET: CARD LIST DENGAN LAYOUT LEBIH LAPANG */}
            <div className="hidden md:block lg:hidden mt-4">
              <div className="max-w-3xl mx-auto space-y-4">
                {currentItems.map((u, index) => (
                  <div
                    key={u.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-5 flex flex-col gap-3"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <p className="text-[11px] uppercase tracking-wide text-gray-400">
                          Ujian #{startIndex + index + 1}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900 leading-snug break-words">
                          {u.keterangan}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-600 text-[11px] font-medium px-2 py-0.5">
                          {u.durasi ? `${u.durasi} mnt` : "Tanpa durasi"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 mt-1.5">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <FaCalendarAlt className="w-3.5 h-3.5 text-gray-400" />
                          <div className="flex flex-col">
                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                              Tanggal
                            </span>
                            <span>
                              {formatTanggal(u.tanggal)} &ndash;{" "}
                              {formatTanggal(u.tanggal_berakhir)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <FaClock className="w-3.5 h-3.5 text-gray-400" />
                          <div className="flex flex-col">
                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                              Jendela Waktu
                            </span>
                            <span>
                              {(u.jam_mulai || "--:--") +
                                " – " +
                                (u.jam_berakhir || "--:--")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 mt-2 border-t border-dashed border-gray-200">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => navigate(`/admin/edit-soal/${u.id}`)}
                          className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition"
                        >
                          <FaEdit className="w-3.5 h-3.5" />
                          <span>Edit Ujian</span>
                        </button>

                        <button
                          onClick={() => handleSalin(u)}
                          className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition"
                        >
                          <FaCopy className="w-3.5 h-3.5" />
                          <span>Salin</span>
                        </button>

                        <button
                          onClick={() => handleDelete(u.id)}
                          className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition"
                        >
                          <FaTrash className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DESKTOP: TABEL PENUH */}
            <div className="hidden lg:block mt-4">
              <div className="overflow-x-auto bg-white rounded-xl shadow-md border border-gray-200">
                <table className="min-w-full text-sm text-left border-collapse">
                  <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                    <tr>
                      <th className="py-3 px-5 w-[60px] border border-gray-200">
                        No
                      </th>
                      <th className="py-3 px-5 w-[40%] border border-gray-200">
                        Keterangan
                      </th>
                      <th className="py-3 px-5 w-[15%] border border-gray-200">
                        Tanggal Mulai
                      </th>
                      <th className="py-3 px-5 w-[15%] border border-gray-200">
                        Tanggal Akhir
                      </th>
                      <th className="py-3 px-5 w-[20%] border border-gray-200">
                        Jendela Waktu
                      </th>
                      <th className="py-3 px-5 w-[10%] border border-gray-200">
                        Durasi
                      </th>
                      <th className="py-3 px-5 w-[10%] text-center border border-gray-200">
                        Aksi
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {currentItems.map((u, index) => (
                      <tr
                        key={u.id}
                        className="hover:bg-gray-50 align-top border border-gray-200"
                      >
                        <td className="py-3 px-5 text-gray-700 border border-gray-200">
                          {startIndex + index + 1}
                        </td>

                        <td className="py-3 px-5 font-medium text-gray-800 whitespace-normal break-words border border-gray-200">
                          {u.keterangan}
                        </td>

                        <td className="py-3 px-5 whitespace-nowrap border border-gray-200">
                          {formatTanggal(u.tanggal)}
                        </td>

                        <td className="py-3 px-5 whitespace-nowrap border border-gray-200">
                          {formatTanggal(u.tanggal_berakhir)}
                        </td>

                        <td className="py-3 px-5 whitespace-nowrap border border-gray-200">
                          {(u.jam_mulai || "--:--") +
                            " – " +
                            (u.jam_berakhir || "--:--")}
                        </td>

                        <td className="py-3 px-5 whitespace-nowrap border border-gray-200">
                          {u.durasi ? `${u.durasi} menit` : "-"}
                        </td>

                        <td className="py-3 px-5 text-center border border-gray-200">
                          <div className="flex justify-center gap-3">
                            <button
                              onClick={() =>
                                navigate(`/admin/edit-soal/${u.id}`)
                              }
                              className="text-blue-600 hover:text-blue-800 transition"
                              title="Edit Ujian"
                            >
                              <FaEdit />
                            </button>

                            <button
                              onClick={() => handleSalin(u)}
                              className="text-green-600 hover:text-green-800 transition"
                              title="Salin Ujian"
                            >
                              <FaCopy />
                            </button>

                            <button
                              onClick={() => handleDelete(u.id)}
                              className="text-red-500 hover:text-red-700 transition"
                              title="Hapus Ujian"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PAGINATION CONTROL (SEMUA DEVICE) */}
            {totalItems > 0 && (
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-[11px] sm:text-xs md:text-sm text-gray-600">
                  Halaman{" "}
                  <span className="font-semibold">{currentPageSafe}</span> dari{" "}
                  <span className="font-semibold">{totalPages}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPageSafe === 1}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs sm:text-sm border ${
                      currentPageSafe === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <FaChevronLeft className="w-3 h-3" />
                    <span>Sebelumnya</span>
                  </button>

                  {/* Nomor halaman */}
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const page = idx + 1;
                    const isNearCurrent =
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPageSafe) <= 1;
                    if (!isNearCurrent && totalPages > 5) {
                      if (page === 2 && currentPageSafe > 3) {
                        return (
                          <span
                            key={page}
                            className="px-1 text-xs sm:text-sm text-gray-400"
                          >
                            ...
                          </span>
                        );
                      }
                      if (
                        page === totalPages - 1 &&
                        currentPageSafe < totalPages - 2
                      ) {
                        return (
                          <span
                            key={page}
                            className="px-1 text-xs sm:text-sm text-gray-400"
                          >
                            ...
                          </span>
                        );
                      }
                      if (page !== 1 && page !== totalPages) {
                        return null;
                      }
                    }

                    const isActive = page === currentPageSafe;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`min-w-[28px] px-2 py-1.5 rounded-md text-xs sm:text-sm border text-center ${
                          isActive
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-700 hover:bg-gray-100 border-gray-200"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    onClick={handleNextPage}
                    disabled={currentPageSafe === totalPages}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs sm:text-sm border ${
                      currentPageSafe === totalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <span>Selanjutnya</span>
                    <FaChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DaftarSoal;