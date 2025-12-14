// src/component/submitujian.jsx

import React from "react";
import { FaCheckCircle, FaExclamationTriangle, FaSpinner } from "react-icons/fa";

const SubmitUjianModal = ({
  mode,
  onConfirm,
  onCancel,
  isSubmitting,
  countdown, // <-- Prop baru untuk countdown
}) => {
  return (
    // Lapisan Latar (Overlay)
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px]">
      {/* Konten Modal */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 md:p-8">
        {mode === "confirm" && (
          // === MODE KONFIRMASI (Tombol Kumpulkan) ===
          <>
            <div className="flex justify-center mb-4">
              <FaExclamationTriangle className="text-6xl text-yellow-400" />
            </div>
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-3">
              Kumpulkan Jawaban?
            </h2>
            <p className="text-center text-gray-600 mb-8">
              Apakah Anda yakin ingin menyelesaikan ujian ini? Anda tidak dapat
              mengubah jawaban setelah dikumpulkan.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={onCancel}
                disabled={isSubmitting}
                className="px-4 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={onConfirm}
                disabled={isSubmitting}
                className="px-4 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaCheckCircle />
                )}
                <span>{isSubmitting ? "Mengumpulkan..." : "Ya, Kumpulkan"}</span>
              </button>
            </div>
          </>
        )}

        {mode === "auto_submit" && (
          // === MODE AUTO-SUBMIT (Waktu Habis) ===
          <>
            <div className="flex justify-center mb-4">
              {isSubmitting ? (
                // 1. Saat sedang mengirim
                <FaSpinner className="text-6xl text-blue-500 animate-spin" />
              ) : (
                // 2. Saat sudah terkirim (sukses)
                <FaCheckCircle className="text-6xl text-green-500" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-3">
              {isSubmitting ? "Waktu Habis!" : "Jawaban Terkirim"}
            </h2>
            <p className="text-center text-gray-600 mb-2">
              {isSubmitting
                ? "Waktu pengerjaan Anda telah berakhir. Sedang mengumpulkan jawaban Anda secara otomatis..."
                : "Jawaban telah dikirim secara otomatis."
              }
            </p>
            
            {/* 3. Tampilkan countdown HANYA jika submit sudah selesai */}
            {!isSubmitting && (
              <p className="text-center text-gray-600 font-semibold mt-4">
                Halaman akan dialihkan dalam {countdown}...
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SubmitUjianModal;