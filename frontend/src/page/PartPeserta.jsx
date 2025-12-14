import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StatusUjian from "../component/statusujian";

import {
  FaUser,
  FaPhoneAlt,
  FaEnvelope,
  FaArrowRight,
  FaArrowLeft,
  FaLock,
  FaCheckCircle,
  FaSpinner,
} from "react-icons/fa";

const API_URL = "https://kompeta.web.bps.go.id";

const PartPeserta = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nama: "",
    nohp: "",
    email: "",
  });

  const [pesertaId, setPesertaId] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [popup, setPopup] = useState({
    isOpen: false,
    message: "",
  });

  const handleClosePopup = () => {
    setPopup({ isOpen: false, message: "" });
  };

  useEffect(() => {
    const loginData = JSON.parse(localStorage.getItem("loginPeserta"));
    if (loginData && loginData.email) {
      setForm((prev) => ({ ...prev, email: loginData.email }));

      const existingPesertaData = JSON.parse(
        localStorage.getItem("pesertaData")
      );
      if (
        existingPesertaData &&
        existingPesertaData.id &&
        existingPesertaData.email === loginData.email
      ) {
        setPesertaId(existingPesertaData.id);
        setForm((prev) => ({
          ...prev,
          nama: prev.nama || existingPesertaData.nama,
          nohp: prev.nohp || existingPesertaData.nohp,
        }));
      }
    } else {
      alert("Sesi login tidak ditemukan. Harap login kembali.");
      navigate("/");
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.nama.trim() || !form.nohp.trim() || !form.email.trim()) {
      alert("Semua kolom wajib diisi.");
      return;
    }
    setSubmitted(true);
  };

  const handleMulaiUjian = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      let res;
      let finalPesertaId = pesertaId;

      const existingPesertaData = JSON.parse(
        localStorage.getItem("pesertaData")
      );
      if (
        existingPesertaData &&
        existingPesertaData.id &&
        existingPesertaData.email === form.email
      ) {
        finalPesertaId = existingPesertaData.id;
      }

      const payload = { ...form };

      // [FIX] Tambahkan header Accept: application/json agar server melempar error dalam format JSON
      if (finalPesertaId) {
        res = await fetch(`${API_URL}/api/peserta/${finalPesertaId}`, {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json" 
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_URL}/api/peserta`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      
      // Tangkap error validasi atau server error
      if (!res.ok) {
        throw new Error(data.message || data.error || "Gagal menyimpan data peserta.");
      }

      const newPesertaId = finalPesertaId || data.id;

      if (!newPesertaId) {
        setIsSaving(false); 
        setPopup({
          isOpen: true,
          message: "Gagal mendapatkan ID Peserta dari server. Data tidak tersimpan. Silakan coba lagi.",
        });
        return;
      }

      setPesertaId(newPesertaId);

      const pesertaData = { id: newPesertaId, ...form };
      localStorage.setItem("pesertaData", JSON.stringify(pesertaData));

      const loginData = JSON.parse(localStorage.getItem("loginPeserta"));
      if (!loginData || !loginData.examId) {
        throw new Error("Data login (ID Ujian) tidak ditemukan. Harap login ulang.");
      }

      const examId = loginData.examId;
      const resUjian = await fetch(`${API_URL}/api/ujian/check-active/${examId}`);
      const ujianData = await resUjian.json();

      if (!resUjian.ok) {
        throw new Error(ujianData.message || "Gagal memverifikasi ujian.");
      }

      navigate(`/ujian/${ujianData.id}`);
    } catch (err) {
      setPopup({
        isOpen: true,
        message: err.message || "Gagal memuat ujian.",
      });
      setIsSaving(false);
    }
  };

  return (
    <>
      <StatusUjian
        isOpen={popup.isOpen}
        message={popup.message}
        onClose={handleClosePopup}
      />

      <div className="flex-1 flex items-center justify-center p-4 md:p-8 bg-gray-50/50">
        <div className="w-full max-w-md">
          <div className="bg-white shadow-xl ring-1 ring-gray-900/5 rounded-2xl overflow-hidden">
            {!submitted ? (
              /* === FORM INPUT === */
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Lengkapi Data
                  </h2>
                  <p className="text-sm text-gray-500 mt-2">
                    Mohon isi data diri Anda dengan benar sebelum memulai ujian.
                  </p>
                </div>

                {/* Nama */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Nama Lengkap (Sesuai KTP)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="nama"
                      value={form.nama}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 sm:text-sm"
                      placeholder="Masukan Nama Anda Disini"
                      required
                    />
                  </div>
                </div>

                {/* No HP */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Nomor WhatsApp Aktif
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaPhoneAlt className="text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      name="nohp"
                      value={form.nohp}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 sm:text-sm"
                      placeholder="Masukan Nomor Anda Disini"
                      required
                    />
                  </div>
                </div>

                {/* Email (Read-Only) */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Email Terdaftar
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      readOnly
                      disabled
                      className="block w-full pl-10 pr-10 py-3 border border-gray-200 bg-gray-50 text-gray-500 rounded-xl shadow-sm sm:text-sm cursor-not-allowed font-medium"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <FaLock
                        className="text-gray-400"
                        title="Terkunci dari login"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Email dikunci sesuai data login Anda.
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                >
                  Simpan & Lanjutkan <FaArrowRight />
                </button>
              </form>
            ) : (
              /* === KONFIRMASI DATA === */
              <div className="p-8 text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                  <FaCheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Data Siap!
                </h2>
                <p className="text-sm text-gray-500 mb-8">
                  Periksa kembali data Anda. Jika sudah benar, silakan mulai
                  ujian.
                </p>

                <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 mb-8 text-sm text-left shadow-inner">
                  <ul className="space-y-3">
                    <li className="flex flex-col sm:flex-row sm:justify-between">
                      <span className="text-gray-500 mb-1 sm:mb-0">
                        Nama Lengkap:
                      </span>
                      <span className="font-semibold text-gray-900 break-words text-right">
                        {form.nama}
                      </span>
                    </li>
                    <li className="border-t border-gray-200 my-2"></li>
                    <li className="flex flex-col sm:flex-row sm:justify-between">
                      <span className="text-gray-500 mb-1 sm:mb-0">
                        Nomor HP:
                      </span>
                      <span className="font-semibold text-gray-900 text-right">
                        {form.nohp}
                      </span>
                    </li>
                    <li className="border-t border-gray-200 my-2"></li>
                    <li className="flex flex-col sm:flex-row sm:justify-between">
                      <span className="text-gray-500 mb-1 sm:mb-0">Email:</span>
                      <span className="font-semibold text-gray-900 break-all text-right">
                        {form.email}
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleMulaiUjian}
                    disabled={isSaving}
                    className={`w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${isSaving
                        ? "bg-green-300 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      }`}
                  >
                    {isSaving ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      "🚀"
                    )}
                    {isSaving ? "Memproses..." : "Mulai Ujian Sekarang"}
                  </button>

                  <button
                    onClick={() => setSubmitted(false)}
                    disabled={isSaving}
                    className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50"
                  >
                    <FaArrowLeft /> Edit Data Kembali
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PartPeserta;