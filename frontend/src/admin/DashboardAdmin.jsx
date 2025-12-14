import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  FaTachometerAlt,
  FaListUl,
  FaUsers,
  FaPaperPlane,
  FaPlus,
  FaArrowRight,
  FaSyncAlt,
  FaFileAlt,
} from "react-icons/fa";

const API_URL = "https://kompeta.web.bps.go.id";

// ------------------------------------------------------------------
// HELPER DARI HasilUjian.jsx
// ------------------------------------------------------------------
const groupDataByPeserta = (data) => {
  const grouped = data.reduce((acc, row) => {
    const id = row.peserta_id;
    if (!acc[id]) {
      acc[id] = {
        peserta_id: id,
        nama: row.nama,
        pg_benar: 0,
        total_pg: 0,
      };
    }
    if (row.tipe_soal === "pilihanGanda") {
      acc[id].total_pg += 1;
      if (row.benar) {
        acc[id].pg_benar += 1;
      }
    }
    return acc;
  }, {});

  return Object.values(grouped).map((peserta) => {
    const skor_pg =
      peserta.total_pg > 0
        ? ((peserta.pg_benar / peserta.total_pg) * 100).toFixed(0)
        : 0;
    return {
      ...peserta,
      skor_pg: skor_pg,
    };
  });
};

// ------------------------------------------------------------------
// HELPER DARI DaftarSoal.jsx
// ------------------------------------------------------------------
const pad2 = (n) => String(n).padStart(2, "0");
const toLocalDateOnly = (val) => {
  const d = new Date(val);
  if (!isNaN(d)) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
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

// ------------------------------------------------------------------
// KOMPONEN KARTU STATISTIK (Reusable & Responsive)
// ------------------------------------------------------------------
const StatCard = ({ icon, label, value, to, color }) => (
  <Link
    to={to}
    className={`bg-white p-4 md:p-5 rounded-xl shadow-md border-l-4 ${color} transition-all hover:shadow-lg hover:scale-[1.02] block`}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
        <div className="p-2 md:p-3 rounded-full bg-gray-100 flex-shrink-0">
          {/* Icon size adjustment for mobile */}
          <div className="text-xl md:text-2xl">{icon}</div>
        </div>
        <div className="min-w-0">
          <p className="text-xs md:text-sm font-medium text-gray-500 truncate">
            {label}
          </p>
          <p className="text-2xl md:text-3xl font-bold text-gray-900 truncate">
            {value}
          </p>
        </div>
      </div>
      <FaArrowRight className="text-gray-400 text-sm md:text-base flex-shrink-0" />
    </div>
  </Link>
);

// ------------------------------------------------------------------
// KOMPONEN UTAMA DASHBOARD
// ------------------------------------------------------------------
const DashboardAdmin = () => {
  const [stats, setStats] = useState({
    totalUjian: 0,
    totalPeserta: 0,
    totalUndangan: 0,
  });
  const [recentUjian, setRecentUjian] = useState([]);
  const [recentHasil, setRecentHasil] = useState([]);
  const [loading, setLoading] = useState(true);

  // ============================
  // FETCH DATA
  // ============================
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem("adminToken");
      if (!token) {
        console.error("Token admin tidak ditemukan di sessionStorage.");
        return;
      }

      let adminId = null;
      try {
        const adminData = JSON.parse(
          sessionStorage.getItem("adminData") || "{}"
        );
        adminId = adminData?.id;
      } catch (e) {
        console.error("adminData rusak / bukan JSON:", e);
      }

      if (!adminId) {
        console.error(
          "Admin ID tidak ditemukan. Cek adminData di sessionStorage."
        );
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      const [resUjian, resHasil, resUndangan] = await Promise.allSettled([
        fetch(`${API_URL}/api/ujian`, { headers }),
        fetch(`${API_URL}/api/hasil`, { headers }),
        fetch(`${API_URL}/api/invite/list`, { headers }),
      ]);

      let totalUjian = 0,
        totalPeserta = 0,
        totalUndangan = 0,
        listUjian = [],
        listHasil = [];

      let myUjianAll = [];

      // ---------------- UJIAN ----------------
      if (resUjian.status === "fulfilled" && resUjian.value.ok) {
        const dataUjian = await resUjian.value.json();
        myUjianAll = dataUjian.filter(
          (u) => Number(u.admin_id) === Number(adminId)
        );
        totalUjian = myUjianAll.length;
        listUjian = [...myUjianAll]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5);
      }

      // ---------------- HASIL ----------------
      if (resHasil.status === "fulfilled" && resHasil.value.ok) {
        const dataHasil = await resHasil.value.json();
        const myExamIds = new Set(myUjianAll.map((u) => Number(u.id)));

        const myHasilRaw = dataHasil.filter((row) => {
          if (row.admin_id != null) {
            return Number(row.admin_id) === Number(adminId);
          }
          if (row.exam_id != null) {
            return myExamIds.has(Number(row.exam_id));
          }
          return false;
        });

        const groupedData = groupDataByPeserta(myHasilRaw);
        totalPeserta = groupedData.length;
        listHasil = groupedData.slice(-5).reverse();
      }

      // ---------------- UNDANGAN ----------------
      if (resUndangan.status === "fulfilled" && resUndangan.value.ok) {
        const dataUndangan = await resUndangan.value.json();
        totalUndangan = dataUndangan.length; 
      }

      setStats({ totalUjian, totalPeserta, totalUndangan });
      setRecentUjian(listUjian);
      setRecentHasil(listHasil);
    } catch (err) {
      console.error("Gagal memuat data dashboard:", err);
      alert("Gagal memuat data dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen flex justify-center items-center">
        <FaSyncAlt className="animate-spin text-4xl text-blue-600" />
      </div>
    );
  }

  return (
    <>
      <div className="bg-gray-50 min-h-screen flex flex-col font-sans">
        {/* 1. HEADER */}
        <div className="bg-white shadow-sm border-b border-gray-300 py-4 pl-14 pr-4 md:px-8 md:py-5 sticky top-0 z-50 transition-all">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900 flex items-center gap-2">
            {/* ICON DIBUNGKUS, NANTI DIHIDE DI MOBILE VIA CSS */}
            <span className="dashboard-header-icon inline-flex">
              <FaTachometerAlt className="text-blue-600 w-5 h-5 md:w-6 md:h-6" />
            </span>
            Dashboard Admin
          </h2>
        </div>

        {/* 2. KONTEN */}
        <div className="p-4 md:p-8 lg:p-10 flex-1 dashboard-content">
          <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
            {/* 2.1 RINGKASAN STATISTIK */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 dashboard-stat-grid">
              <StatCard
                to="/admin/daftar-soal"
                label="Daftar Ujian"
                value={stats.totalUjian}
                color="border-blue-500"
                icon={<FaListUl className="text-blue-500" />}
              />
              <StatCard
                to="/admin/hasil-ujian"
                label="Total Peserta"
                value={stats.totalPeserta}
                color="border-green-500"
                icon={<FaUsers className="text-green-500" />}
              />
              <StatCard
                to="/admin/tambah-peserta"
                label="Undangan Terkirim"
                value={stats.totalUndangan}
                color="border-yellow-500"
                icon={<FaPaperPlane className="text-yellow-500" />}
              />
            </div>

            {/* 2.2 AKSI CEPAT */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <Link
                to="/admin/tambah-soal"
                className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-200 flex justify-between items-center transition-all hover:bg-gray-50 hover:shadow-lg group"
              >
                <div>
                  <h3 className="text-lg md:text-xl font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                    Tambah Ujian
                  </h3>
                  <p className="text-gray-500 text-xs md:text-sm mt-1">
                    Buat soal pilihan ganda atau esai baru.
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full flex-shrink-0">
                  <FaPlus className="text-blue-600 text-lg md:text-xl" />
                </div>
              </Link>
              <Link
                to="/admin/tambah-peserta"
                className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-200 flex justify-between items-center transition-all hover:bg-gray-50 hover:shadow-lg group"
              >
                <div>
                  <h3 className="text-lg md:text-xl font-semibold text-gray-800 group-hover:text-green-600 transition-colors">
                    Undang Peserta
                  </h3>
                  <p className="text-gray-500 text-xs md:text-sm mt-1">
                    Kirim undangan ujian via email.
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full flex-shrink-0">
                  <FaPaperPlane className="text-green-600 text-lg md:text-xl" />
                </div>
              </Link>
            </div>

            {/* 2.3 AKTIVITAS TERBARU */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              {/* Ujian Terbaru */}
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-200">
                <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                  <h3 className="text-base md:text-lg font-semibold text-gray-800">
                    Ujian Terbaru
                  </h3>
                  <Link
                    to="/admin/daftar-soal"
                    className="text-xs md:text-sm font-medium text-blue-600 hover:underline"
                  >
                    Lihat Semua
                  </Link>
                </div>
                <div className="space-y-3 dashboard-card-list">
                  {recentUjian.length > 0 ? (
                    recentUjian.map((ujian) => (
                      <div
                        key={ujian.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 gap-3 dashboard-card-list-item"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-700 text-sm md:text-base truncate">
                            {ujian.keterangan}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {formatTanggal(ujian.tanggal)}
                          </p>
                        </div>
                        <Link
                          to={`/admin/edit-soal/${ujian.id}`}
                          className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-full transition-colors flex-shrink-0 icon-link"
                          title="Edit Soal"
                        >
                          <FaArrowRight size={14} />
                        </Link>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Belum ada ujian yang dibuat.
                    </p>
                  )}
                </div>
              </div>

              {/* Hasil Terbaru */}
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-200">
                <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                  <h3 className="text-base md:text-lg font-semibold text-gray-800">
                    Hasil Terbaru
                  </h3>
                  <Link
                    to="/admin/hasil-ujian"
                    className="text-xs md:text-sm font-medium text-blue-600 hover:underline"
                  >
                    Lihat Semua
                  </Link>
                </div>
                <div className="space-y-3 dashboard-card-list">
                  {recentHasil.length > 0 ? (
                    recentHasil.map((hasil) => (
                      <div
                        key={hasil.peserta_id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 gap-3 dashboard-card-list-item"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-700 text-sm md:text-base truncate">
                            {hasil.nama}
                          </p>
                          <p className="text-xs text-gray-500">
                            Skor PG:{" "}
                            <span className="font-bold text-blue-700">
                              {hasil.skor_pg}%
                            </span>
                          </p>
                        </div>
                        <Link
                          to={`/admin/hasil/${hasil.peserta_id}`}
                          className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-full transition-colors flex-shrink-0 icon-link"
                          title="Lihat Detail"
                        >
                          <FaFileAlt size={14} />
                        </Link>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Belum ada peserta yang mengerjakan.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE & TABLET-ONLY OVERRIDES */}
      <style>{`
        /* Tablet (640px - 1024px): atur ulang kolom statistik agar lebih nyaman */
        @media (max-width: 1024px) and (min-width: 640px) {
          .dashboard-stat-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        /* Smartphone (<= 639px): optimasi list & header */
        @media (max-width: 639px) {
          .dashboard-content {
            padding-bottom: 1.25rem;
          }

          .dashboard-card-list {
            max-height: 340px;
            overflow-y: auto;
            padding-right: 0.25rem;
            -webkit-overflow-scrolling: touch;
          }

          .dashboard-card-list-item {
            align-items: flex-start;
          }

          .dashboard-card-list-item > div:first-child {
            margin-right: 0.5rem;
          }

          .dashboard-card-list-item .icon-link {
            padding: 0.35rem 0.65rem;
          }

          /* HIDE ICON DI SEBELAH TEKS "Dashboard Admin" KHUSUS MOBILE */
          .dashboard-header-icon {
            display: none;
          }
        }
      `}</style>
    </>
  );
};

export default DashboardAdmin;
