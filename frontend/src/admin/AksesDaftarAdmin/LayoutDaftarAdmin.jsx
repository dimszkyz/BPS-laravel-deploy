// File: src/admin/LayoutDaftarAdmin.jsx

import React, { useState, useEffect, useCallback } from "react";
import {
  FaUserShield,
  FaArrowLeft,
  FaListUl,
  FaEnvelopeOpenText,
  FaPoll,
  FaSearch,
  FaSyncAlt,
  FaSpinner,
  FaExclamationCircle,
  FaUserTie
} from "react-icons/fa";

// Import Komponen Tab
import TabUjianAdmin from "./TabUjianAdmin";
import TabUndanganAdmin from "./TabUndanganAdmin";
import TabHasilAdmin from "./TabHasilAdmin";

const API_URL = "https://kompeta.web.bps.go.id";

// ==========================================
// KOMPONEN UTAMA: LAYOUT DAFTAR ADMIN
// ==========================================
const LayoutDaftarAdmin = () => {
  const [viewMode, setViewMode] = useState("LIST"); // 'LIST' or 'DETAIL'
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [activeTab, setActiveTab] = useState("ujian"); // 'ujian', 'undangan', 'hasil'

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/api/admin-list`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setAdmins(data);
      } else {
        setAdmins([]);
      }
    } catch (error) {
      console.error("Network error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const filteredAdmins = admins.filter(a =>
    (a.username || "").toLowerCase().includes(search.toLowerCase()) ||
    (a.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectAdmin = (admin) => {
    setSelectedAdmin(admin);
    setActiveTab("ujian");
    setViewMode("DETAIL");
  };

  const handleBackToList = () => {
    setSelectedAdmin(null);
    setViewMode("LIST");
  };

  // === TAMPILAN DETAIL (RESPONSIF & PROFESIONAL) ===
  if (viewMode === "DETAIL" && selectedAdmin) {
    return (
      <div className="bg-gray-50 min-h-screen flex flex-col animate-in fade-in duration-300">

        {/* 1. HEADER DETAIL */}
        <div className="bg-white shadow-sm border-b border-gray-300 py-4 pl-14 pr-4 md:px-8 md:py-5 sticky top-0 z-50 flex items-center gap-3 transition-all">
          {/* Tombol Kembali: Hilang di Mobile (hidden), Muncul di Desktop (md:block) */}
          <button
            onClick={handleBackToList}
            className="hidden md:block p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600 transition"
            title="Kembali ke daftar"
          >
            <FaArrowLeft />
          </button>

          <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
            Detail Admin
          </h2>
        </div>

        {/* 2. KONTEN UTAMA */}
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">

          {/* Kartu Profil Admin (Desain Profesional - Teks di Kanan Ikon) */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
            {/* Flex row memastikan ikon dan teks selalu bersebelahan */}
            <div className="flex flex-row items-start gap-5 md:gap-6">

              {/* Avatar Icon */}
              <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0 shadow-inner">
                <FaUserShield size={24} className="md:w-9 md:h-9" />
              </div>

              {/* Informasi Text */}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-1 leading-tight">
                  {selectedAdmin.username}
                </h2>
                <p className="text-sm md:text-base text-gray-600 font-medium mb-3 truncate">
                  {selectedAdmin.email}
                </p>

                <div className="pt-3 border-t border-gray-100 w-full md:w-auto inline-block">
                  <p className="text-xs md:text-sm text-gray-400">
                    Bergabung: <span className="text-gray-600 font-medium">{new Date(selectedAdmin.created_at).toLocaleDateString('id-ID')}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Container Tabs & Konten */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

            {/* Navigasi Tab (Scrollable di Mobile) */}
            <div className="flex border-b border-gray-200 overflow-x-auto no-scrollbar bg-white">
              <button
                onClick={() => setActiveTab("ujian")}
                className={`flex-1 min-w-[110px] px-4 py-4 text-sm font-semibold border-b-[3px] transition-all duration-200 flex flex-col md:flex-row justify-center items-center gap-2 whitespace-nowrap 
                    ${activeTab === 'ujian'
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
              >
                <FaListUl className="text-lg" />
                <span>Daftar Ujian</span>
              </button>
              <button
                onClick={() => setActiveTab("undangan")}
                className={`flex-1 min-w-[140px] px-4 py-4 text-sm font-semibold border-b-[3px] transition-all duration-200 flex flex-col md:flex-row justify-center items-center gap-2 whitespace-nowrap 
                    ${activeTab === 'undangan'
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
              >
                <FaEnvelopeOpenText className="text-lg" />
                <span>Riwayat Undangan</span>
              </button>
              <button
                onClick={() => setActiveTab("hasil")}
                className={`flex-1 min-w-[110px] px-4 py-4 text-sm font-semibold border-b-[3px] transition-all duration-200 flex flex-col md:flex-row justify-center items-center gap-2 whitespace-nowrap 
                    ${activeTab === 'hasil'
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
              >
                <FaPoll className="text-lg" />
                <span>Hasil Ujian</span>
              </button>
            </div>

            {/* Isi Konten Tab */}
            <div className="p-4 md:p-6 min-h-[400px]">
              {activeTab === "ujian" && <TabUjianAdmin adminId={selectedAdmin.id} />}
              {activeTab === "undangan" && <TabUndanganAdmin adminId={selectedAdmin.id} />}
              {activeTab === "hasil" && <TabHasilAdmin adminId={selectedAdmin.id} />}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === TAMPILAN LIST (UTAMA) ===
  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* HEADER (Navbar Sticky) */}
      <div className="bg-white shadow-sm border-b border-gray-300 py-4 pl-14 pr-4 md:px-8 md:py-5 sticky top-0 z-50 flex justify-between items-center transition-all">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900 flex items-center gap-2">
            {/* Icon hanya tampil di Desktop */}
            <span className="hidden md:inline-flex p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
              <FaUserShield size={20} />
            </span>
            <span>Akses Daftar Admin</span>
          </h2>
          {/* Deskripsi hanya tampil di Desktop */}
          <p className="hidden md:block text-gray-500 mt-1 text-sm">
            Pantau aktivitas ujian, undangan, dan hasil dari admin yang terdaftar.
          </p>
        </div>

        {/* SEARCH & REFRESH (Hanya Tampil di Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari admin..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition w-64 text-sm"
            />
          </div>
          <button
            onClick={fetchAdmins}
            className="p-2 bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 hover:text-indigo-600 transition shadow-sm"
            title="Refresh Data"
          >
            <FaSyncAlt className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* SEARCH SECTION (Hanya Tampil di Mobile) */}
      <div className="md:hidden px-4 pt-4">
        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 flex gap-2">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari admin..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition w-full text-sm"
            />
          </div>
          <button
            onClick={fetchAdmins}
            className="p-2 bg-gray-100 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-200 hover:text-indigo-600 transition"
          >
            <FaSyncAlt className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Content List */}
      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
        {loading ? (
          <div className="text-center py-16 text-gray-500">
            <FaSpinner className="animate-spin text-4xl mx-auto mb-3 text-indigo-400" />
            <p>Sedang memuat data admin...</p>
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
            <FaExclamationCircle className="text-4xl mx-auto mb-3 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-800">
              Tidak ada admin ditemukan
            </h3>
            <p className="text-gray-500 text-sm px-4">
              Coba kata kunci lain atau pastikan ada admin yang terdaftar selain
              Superadmin.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredAdmins.map((admin) => {
              const isActive =
                admin.is_active !== undefined ? (admin.is_active === 1 || admin.is_active === true) : true;

              return (
                <div
                  key={admin.id}
                  onClick={() => handleSelectAdmin(admin)}
                  className={`bg-white p-0 rounded-xl border shadow-sm hover:shadow-lg cursor-pointer transition-all duration-200 group relative overflow-hidden flex flex-col ${isActive
                      ? "border-gray-200 hover:border-indigo-300"
                      : "border-red-100 bg-red-50/30 hover:border-red-200"
                    }`}
                >
                  <div className="p-5 md:p-6 flex-1">
                    <div className="flex items-start justify-between mb-4">
                      {/* Icon User */}
                      <div
                        className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-colors duration-200 ${isActive
                            ? "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white"
                            : "bg-gray-100 text-gray-400"
                          }`}
                      >
                        <FaUserTie size={18} className="md:w-5 md:h-5" />
                      </div>

                      {/* Group Badge Role & Status */}
                      <div className="flex flex-col items-end gap-1.5 md:gap-2">
                        <span className="text-[10px] font-bold tracking-wider px-2 py-1 bg-gray-100 text-gray-600 rounded uppercase border border-gray-200">
                          {admin.role}
                        </span>
                        <span
                          className={`text-[10px] font-bold tracking-wider px-2 py-1 rounded uppercase border ${isActive
                              ? "bg-green-50 text-green-600 border-green-200"
                              : "bg-red-50 text-red-600 border-red-200"
                            }`}
                        >
                          {isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>
                    </div>

                    <h3
                      className={`text-base md:text-lg font-bold transition mb-1 ${isActive
                          ? "text-gray-900 group-hover:text-indigo-700"
                          : "text-gray-500"
                        }`}
                    >
                      {admin.username}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-500 truncate">
                      {admin.email}
                    </p>
                  </div>

                  <div className="bg-gray-50 px-5 md:px-6 py-3 border-t border-gray-100 flex justify-between items-center text-xs">
                    <span className="text-gray-400"></span>
                    <span className="text-indigo-600 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Lihat Detail &rarr;
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LayoutDaftarAdmin;