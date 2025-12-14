// File: src/component/header.jsx (Teks header menggunakan font Bodoni)

import React, { useState, useEffect } from "react";
import { FaSpinner } from "react-icons/fa";

const API_URL = "https://kompeta.web.bps.go.id";

/**
 * Header Global yang mengambil data (logo & teks) dari API.
 */
const Header = () => {
  const [logoUrl, setLogoUrl] = useState(null);
  const [headerText, setHeaderText] = useState("Ujian Online"); // Default text
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/api/settings`);
        if (!res.ok) throw new Error("Gagal memuat pengaturan header");
        const data = await res.json();

        // Set teks header jika ada, jika tidak, gunakan default
        if (data.headerText) {
          setHeaderText(data.headerText);
        }

        // Set logo jika ada. Path-nya akan jadi /uploads/namafile.png
        if (data.headerLogo) {
          setLogoUrl(`${API_URL}${data.headerLogo}`);
        }
      } catch (err) {
        console.error(err.message);
        // Biarkan menggunakan nilai default jika gagal fetch
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  /**
   * Render placeholder saat loading
   */
  const renderLoading = () => (
    <div className="flex items-center gap-3 min-w-0 flex-1">
      <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse shrink-0"></div>
      <div className="h-5 w-48 bg-gray-200 rounded-md animate-pulse"></div>
    </div>
  );

  /**
   * Render header setelah data (atau default) siap
   */
  const renderHeader = () => (
    <div className="flex items-center gap-3 min-w-0 flex-1">
      {/* Logo atau Default Box */}
      {logoUrl ? (
        <img
          src={logoUrl}
          alt="Logo"
          className="w-10 h-10 rounded-full object-contain shrink-0"
        />
      ) : (
        // Fallback jika tidak ada logo
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white text-base font-semibold shrink-0">
          BPS
        </div>
      )}

      {/* Teks Header */}
      {/* ▼▼▼ PERUBAHAN DI SINI ▼▼▼ */}
      <div className="text-base font-semibold text-gray-800 truncate [font-family:Bodoni,serif]">
      {/* ▲▲▲ Ditambahkan [font-family:Bodoni,serif] ▲▲▲ */}
        {headerText}
      </div>
    </div>
  );

  return (
    <header className="relative z-30 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {loading ? renderLoading() : renderHeader()}
        
        {/* Anda bisa tambahkan bagian kanan di sini jika perlu, 
            misalnya tombol Logout, dll. */}
      </div>
    </header>
  );
};

export default Header;