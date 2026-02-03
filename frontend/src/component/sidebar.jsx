// File: src/component/sidebar.jsx
import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaClipboardList,
  FaEdit,
  FaChartLine,
  FaCog,
  FaSignOutAlt,
  FaUserPlus,
  FaPoll,
  FaExclamationTriangle,
  FaSpinner,
  FaUserShield,
  FaKey,
  FaBars,
  FaTimes,
} from "react-icons/fa";

const API_URL = "https://kompeta.web.bps.go.id";

const Sidebar = () => {
  const navigate = useNavigate();
  
  // --- STATE BARU UNTUK LOGO ---
  const [logoUrl, setLogoUrl] = useState(null); 
  
  const [hasNewResult, setHasNewResult] = useState(false);
  const [adminData, setAdminData] = useState({
    username: "",
    email: "",
    role: "admin",
  });
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- LOGIC AUTHENTICATION & FETCH SETTINGS ---
  const forceLogout = () => {
    sessionStorage.clear();
    window.location.href = "/admin/login";
  };

  useEffect(() => {
    // 1. Cek Token di Storage
    const token = sessionStorage.getItem("adminToken");
    if (!token) {
      forceLogout();
      return;
    }

    // 2. Load Data Admin dari Storage
    try {
      const storedAdmin = JSON.parse(
        sessionStorage.getItem("adminData") || "{}"
      );
      setAdminData({
        username: storedAdmin.username || "Admin",
        email: storedAdmin.email || "admin@bps.com",
        role: storedAdmin.role || "admin",
      });

      const newResult = sessionStorage.getItem("newHasilUjian") === "true";
      if (newResult) setHasNewResult(true);
    } catch (error) {
      console.error("Gagal load data admin:", error);
    }

    // 3. Cek Validitas Token via API
    const verifyToken = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/admin/me`, {
           headers: { 
             "Authorization": `Bearer ${token}`,
             "Accept": "application/json" 
           }
        });

        if (res.status === 401) {
          console.warn("Sesi habis, logout...");
          forceLogout();
        }
      } catch (err) {
        console.error("Gagal verifikasi sesi:", err);
      }
    };

    // --- LOGIC BARU: AMBIL LOGO DARI API SETTINGS ---
    const fetchLogo = async () => {
      try {
        const res = await fetch(`${API_URL}/api/settings`);
        if (res.ok) {
          const data = await res.json();
          if (data.headerLogo) {
            setLogoUrl(`${API_URL}${data.headerLogo}`);
          }
        }
      } catch (err) {
        console.error("Gagal memuat logo sidebar:", err);
      }
    };

    verifyToken();
    fetchLogo(); // Jalankan fetch logo
    
    const intervalId = setInterval(verifyToken, 60000); 
    return () => clearInterval(intervalId);

  }, []);

  // --- HELPER & HANDLER ---
  const getNavLinkClass = ({ isActive }) => {
    const baseClasses =
      "flex items-center space-x-3 py-2.5 px-4 rounded-md transition-colors duration-200 ease-in-out text-sm";
    const activeClasses = "bg-indigo-600 text-white font-medium shadow-sm";
    const inactiveClasses =
      "text-gray-600 hover:bg-indigo-50 hover:text-indigo-700";
    return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
  };

  const handleHasilUjianClick = () => {
    if (hasNewResult) {
      sessionStorage.removeItem("newHasilUjian");
      setHasNewResult(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const token = sessionStorage.getItem("adminToken");
    
    try {
        await fetch(`${API_URL}/api/auth/admin/logout`, {
            method: 'POST',
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json"
            }
        });
    } catch (e) {
        console.log("Logout error di backend (abaikan)", e);
    }

    setTimeout(() => {
      forceLogout();
    }, 500);
  };

  const getInitial = (name = "") => {
    const t = (name || "").trim();
    return t ? t[0].toUpperCase() : "A";
  };

  const renderSidebarBody = () => (
    <div className="w-64 h-full bg-white border-r border-gray-200 flex flex-col shadow-md">
      {/* Header Sidebar: Logo & Judul */}
      <div className="flex items-center space-x-3 px-4 py-5 border-b border-gray-200">
        
        {/* --- BAGIAN YANG DIUBAH: TAMPILKAN LOGO ATAU HURUF 'A' --- */}
        {logoUrl ? (
          <img 
            src={logoUrl} 
            alt="Logo" 
            className="w-8 h-8 rounded-lg object-contain bg-gray-50 border border-gray-100"
          />
        ) : (
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            A
          </div>
        )}
        {/* --------------------------------------------------------- */}

        <h2 className="text-lg font-semibold text-gray-800">Kompeta Panel</h2>
      </div>

      {/* Menu Navigasi */}
      <nav className="flex-grow space-y-4 pt-4 px-4 overflow-y-auto">
        <div>
          <h3 className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Utama
          </h3>
          <ul className="space-y-1">
            <li>
              <NavLink to="/admin/dashboard" className={getNavLinkClass}>
                <FaChartLine className="w-5 h-5" />
                <span>Dashboard</span>
              </NavLink>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Manajemen Ujian
          </h3>
          <ul className="space-y-1">
            <li>
              <NavLink to="/admin/tambah-soal" className={getNavLinkClass}>
                <FaEdit className="w-5 h-5" />
                <span>Tambah Ujian</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/daftar-soal" className={getNavLinkClass}>
                <FaClipboardList className="w-5 h-5" />
                <span>Daftar Ujian</span>
              </NavLink>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Manajemen Pengguna
          </h3>
          <ul className="space-y-1">
            <li>
              <NavLink to="/admin/tambah-peserta" className={getNavLinkClass}>
                <FaUserPlus className="w-5 h-5" />
                <span>Undang &amp; Daftar Peserta</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/hasil-ujian"
                className={getNavLinkClass}
                onClick={handleHasilUjianClick}
              >
                <FaPoll className="w-5 h-5" />
                <span>Hasil Ujian</span>
                {hasNewResult && (
                  <span
                    className="w-2.5 h-2.5 bg-red-500 rounded-full ml-auto animate-pulse"
                    title="Ada hasil ujian baru"
                  />
                )}
              </NavLink>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Sistem
          </h3>
          <ul className="space-y-1">
            {adminData.role === "superadmin" && (
              <>
                <li>
                  <NavLink
                    to="/admin/daftar-admin"
                    className={getNavLinkClass}
                  >
                    <FaUserShield className="w-5 h-5" />
                    <span>Monitoring Admin</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/admin/tambah-admin"
                    className={getNavLinkClass}
                  >
                    <FaUserPlus className="w-5 h-5" />
                    <span>Kelola Admin</span>
                  </NavLink>
                </li>
              </>
            )}
            <li>
              <NavLink to="/admin/ubah-password" className={getNavLinkClass}>
                <FaKey className="w-5 h-5" />
                <span>Ubah Password</span>
              </NavLink>
            </li>
          </ul>
        </div>
      </nav>

      {/* Footer Sidebar */}
      <div className="mt-auto bg-gray-50 border-t border-gray-200 p-4 space-y-3">
        <div className="flex items-center gap-3">
          {adminData.role !== "superadmin" && (
            <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold text-sm ring-1 ring-indigo-700/60">
              {getInitial(adminData.username)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-800 text-sm truncate">
              {adminData.username}
            </p>
            <p className="text-xs text-gray-500 truncate">{adminData.email}</p>
          </div>
          {adminData.role === "superadmin" && (
            <NavLink
              to="/admin/pengaturan"
              className="p-2 rounded-lg text-gray-500 hover:text-indigo-700 hover:bg-indigo-50 transition"
            >
              <FaCog className="w-5 h-5" />
            </NavLink>
          )}
        </div>
        <button
          onClick={() => setShowLogoutModal(true)}
          className="flex items-center space-x-3 w-full py-2.5 px-3 rounded-md text-sm text-gray-600 hover:bg-red-100 hover:text-red-700 transition-colors duration-200 ease-in-out"
        >
          <FaSignOutAlt className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* MOBILE TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => setIsSidebarOpen((prev) => !prev)}
        className={`
    md:hidden fixed top-3 left-3 z-[90]
    flex items-center justify-center
    w-9 h-9 text-gray-700
    transition-all duration-300 transform focus:outline-none
    ${isSidebarOpen
            ? "rounded-lg bg-white/90 shadow-sm hover:bg-gray-100 translate-x-64"
            : "bg-transparent shadow-none translate-x-0"
          }
  `}
        aria-label={isSidebarOpen ? "Tutup menu" : "Buka menu"}
      >
        {isSidebarOpen ? (
          <FaTimes className="w-5 h-5" />
        ) : (
          <FaBars className="w-5 h-5" />
        )}
      </button>

      {/* DESKTOP: sidebar penuh */}
      <div className="hidden md:flex h-screen sticky top-0">
        {renderSidebarBody()}
      </div>

      {/* MOBILE DRAWER OVERLAY */}
      <div
        className={`fixed inset-0 z-[70] md:hidden transition-all duration-300 ${isSidebarOpen ? "pointer-events-auto" : "pointer-events-none"
          }`}
      >
        <div
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isSidebarOpen ? "opacity-100" : "opacity-0"
            }`}
          onClick={() => setIsSidebarOpen(false)}
        />
        <div
          className={`absolute left-0 top-0 bottom-0 transform transition-transform duration-300 shadow-2xl ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          {renderSidebarBody()}
        </div>
      </div>

      {/* Modal Logout */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 md:p-8">
            <div className="flex justify-center mb-4">
              <FaExclamationTriangle className="text-6xl text-yellow-400" />
            </div>
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-3">
              Logout dari akun?
            </h2>
            <p className="text-center text-gray-600 mb-8">
              Apakah yakin <b>{adminData.username}</b> ingin logout dari sistem
              ini?
            </p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                className="px-4 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="px-4 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoggingOut ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    <span>Keluar...</span>
                  </>
                ) : (
                  <>
                    <FaSignOutAlt />
                    <span>Ya, Logout</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;