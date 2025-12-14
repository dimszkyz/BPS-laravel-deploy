import React from "react";
import { FaInfoCircle, FaTimes } from "react-icons/fa";

const StatusUjian = ({ isOpen, message, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    // Backdrop/Overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[4px]">
      
      {/* Konten Modal */}
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-xl p-8 text-center border border-gray-200">
        
        {/* Tombol Close (Opsional, tapi bagus) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
          aria-label="Tutup"
        >
          <FaTimes size={20} />
        </button>

        {/* Ikon Status */}
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
            <FaInfoCircle className="text-blue-500 text-4xl" />
          </div>
        </div>

        {/* Judul */}
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          Informasi
        </h2>

        {/* Pesan Error/Status */}
        <p className="text-gray-600 mb-8 text-base leading-relaxed">
          {message}
        </p>

        {/* Tombol Aksi Utama */}
        <button
          onClick={onClose}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-md transition text-base"
        >
          Mengerti
        </button>
      </div>
    </div>
  );
};

export default StatusUjian;