import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaHome } from 'react-icons/fa';
// ❌ 1. Hapus import Header, karena sudah pindah ke Layout

const KeteranganSelesai = () => {
  const navigate = useNavigate();

  const handleKembali = () => {
    navigate('/');
  };

  return (
    // 2. Ubah div ini.
    //    - Hapus 'min-h-screen' dan 'flex-col'.
    //    - Tambahkan 'flex-1' agar mengisi <main> dari LayoutPeserta.
    //    - 'items-center justify-center' tetap ada untuk menengahkan kartu.
    <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-gray-100">
      
      {/* ❌ 3. Hapus tag <Header /> dari sini */}
      
      {/* ❌ 4. Hapus tag <main ...> dari sini */}
        
      {/* Ini adalah kartu konten Anda - TIDAK BERUBAH */}
      <div className="w-full max-w-lg bg-white shadow-xl rounded-2xl ring-1 ring-gray-900/5 p-10 text-center">
        
        {/* Ikon Sukses */}
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
          <FaCheckCircle className="h-12 w-12 text-green-600" />
        </div>

        {/* Judul */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Ujian Telah Selesai
        </h1>

        {/* Pesan Konfirmasi */}
        <p className="text-base text-gray-600 mb-8">
          Terima kasih telah berpartisipasi dalam ujian ini.
          <br />
          Jawaban Anda telah berhasil direkam oleh sistem.
        </p>

        {/* Tombol Kembali */}
        <button
          onClick={handleKembali}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <FaHome />
          Kembali ke Halaman Utama
        </button>

      </div>
      
      {/* ❌ 5. Hapus tag </main> penutup dari sini */}
      
    </div>
  );
};

export default KeteranganSelesai;