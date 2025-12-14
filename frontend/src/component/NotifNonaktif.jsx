import React, { useState, useEffect } from 'react';
import { FaUserSlash, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const NotifNonaktif = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    // Listener untuk menangkap sinyal khusus "ADMIN_DEACTIVATED"
    const handleDeactivation = () => {
      if (!isOpen) { 
        setIsOpen(true);
        setCountdown(10);
      }
    };

    // Pasang listener di window
    window.addEventListener('ADMIN_DEACTIVATED', handleDeactivation);

    // Bersihkan listener saat unmount
    return () => {
      window.removeEventListener('ADMIN_DEACTIVATED', handleDeactivation);
    };
  }, [isOpen]);

  // Logika Hitung Mundur
  useEffect(() => {
    let timer;
    if (isOpen && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isOpen && countdown === 0) {
      // Waktu habis: Lakukan Logout Paksa
      handleLogout();
    }

    return () => clearInterval(timer);
  }, [isOpen, countdown]);

  const handleLogout = () => {
    sessionStorage.clear(); // Hapus semua sesi
    localStorage.removeItem("newHasilUjian");
    window.location.href = '/admin/login'; // Force reload ke login
  };

  if (!isOpen) return null;

  return (
    // Overlay Hitam Blur (z-index tinggi agar di atas semua konten)
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      
      {/* Kartu Popup */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center transform transition-all scale-100 border-t-8 border-red-500">
        
        {/* Icon Besar */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center animate-pulse">
            <FaUserSlash className="text-5xl text-red-500" />
          </div>
        </div>

        {/* Judul & Pesan */}
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Akses Dinonaktifkan
        </h2>
        <p className="text-gray-600 mb-6 text-sm leading-relaxed">
          Akun Anda telah dinonaktifkan oleh Administrator. Sesi Anda akan berakhir otomatis.
        </p>

        {/* Countdown Box */}
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
          <p className="text-red-800 font-medium flex flex-col items-center justify-center gap-1">
            <span className="text-[10px] uppercase tracking-wider opacity-70">Dialihkan ke Login dalam</span>
            <span className="text-3xl font-bold flex items-center gap-2">
               {countdown} <span className="text-sm font-normal text-red-600">detik</span>
            </span>
          </p>
        </div>

        {/* Tombol Logout Manual */}
        <button 
          onClick={handleLogout} 
          className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <FaSignOutAlt /> Keluar Sekarang
        </button>
      </div>
    </div>
  );
};

export default NotifNonaktif;