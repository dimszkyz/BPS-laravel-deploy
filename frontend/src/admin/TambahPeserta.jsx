// File: src/admin/TambahPeserta.jsx

import React, { useState, useEffect } from "react";
import {
  FaEnvelope,
  FaSyncAlt,
  FaPaperPlane,
  FaPlus,
  FaTimes,
  FaListUl,
  FaKey,
  FaCog,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";
import DaftarUndangan from "./DaftarUndangan";
import EmailPengirim from "./EmailPengirim";

const API_URL = "https://kompeta.web.bps.go.id";

// Helper validasi email sederhana
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const TambahPeserta = () => {
  const [pesan, setPesan] = useState("");
  const [emails, setEmails] = useState([]);
  const [currentEmail, setCurrentEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // --- State Ujian & Batas Login ---
  const [ujianList, setUjianList] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [loadingUjian, setLoadingUjian] = useState(true);
  const [maxLogins, setMaxLogins] = useState(1);

  // --- STATE UNTUK MODAL PENGATURAN EMAIL ---
  const [showEmailSettings, setShowEmailSettings] = useState(false);

  // --- STATE UNTUK NOTIFIKASI (TOAST) ---
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // --- Fetch Daftar Ujian saat komponen dimuat ---
  useEffect(() => {
    const fetchUjianList = async () => {
      try {
        setLoadingUjian(true);
        const token = sessionStorage.getItem("adminToken");
        const res = await fetch(`${API_URL}/api/ujian`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Gagal memuat daftar ujian");
        const data = await res.json();
        // Filter hanya ujian yang belum dihapus
        setUjianList(data.filter((u) => !u.is_deleted));
      } catch (err) {
        console.error(err);
        console.warn("Gagal load ujian:", err.message);
      } finally {
        setLoadingUjian(false);
      }
    };
    fetchUjianList();
  }, []);

  // --- Handler Tambah Email Satu per Satu ---
  const handleAddEmail = () => {
    setErrorMessage("");
    const emailToAdd = currentEmail.trim();

    if (!emailToAdd) {
      setErrorMessage("Masukkan alamat email terlebih dahulu.");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }
    if (!isValidEmail(emailToAdd)) {
      setErrorMessage(`Format email "${emailToAdd}" tidak valid.`);
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }
    if (emails.includes(emailToAdd)) {
      setErrorMessage(`Email "${emailToAdd}" sudah ada dalam daftar.`);
      setCurrentEmail("");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    setEmails([...emails, emailToAdd]);
    setCurrentEmail("");
  };

  // --- FITUR BARU: Handler Paste Banyak Email (Batch) ---
  const handlePaste = (e) => {
    e.preventDefault();

    const pasteData = e.clipboardData.getData("text");
    if (!pasteData) return;

    const rawEmails = pasteData.split(/[\s,;]+/);

    const validNewEmails = [];
    let duplicateCount = 0;
    let invalidCount = 0;

    rawEmails.forEach((emailStr) => {
      const cleanEmail = emailStr.trim();
      if (!cleanEmail) return;

      if (isValidEmail(cleanEmail)) {
        if (!emails.includes(cleanEmail) && !validNewEmails.includes(cleanEmail)) {
          validNewEmails.push(cleanEmail);
        } else {
          duplicateCount++;
        }
      } else {
        invalidCount++;
      }
    });

    if (validNewEmails.length > 0) {
      setEmails((prev) => [...prev, ...validNewEmails]);
      setSuccessMessage(`Berhasil menambahkan ${validNewEmails.length} email.`);
      setTimeout(() => setSuccessMessage(""), 5000);
    } else {
      setErrorMessage("Tidak ada email valid baru yang ditemukan.");
      setTimeout(() => setErrorMessage(""), 5000);
    }

    if (invalidCount > 0 || duplicateCount > 0) {
      console.log(`Info Paste: ${invalidCount} invalid, ${duplicateCount} duplikat.`);
    }
  };

  // --- Handler Hapus Email dari List ---
  const handleRemoveEmail = (indexToRemove) => {
    setEmails(emails.filter((_, index) => index !== indexToRemove));
  };

  // --- Handler Kirim Undangan ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!selectedExamId) {
      setErrorMessage("Pilih ujian yang akan diundang terlebih dahulu.");
      return;
    }

    const maxLoginsNum = parseInt(maxLogins, 10);
    if (isNaN(maxLoginsNum) || maxLoginsNum <= 0) {
      setErrorMessage("Batas login minimal harus 1.");
      return;
    }

    const finalCurrentEmail = currentEmail.trim();
    let finalEmails = [...emails];

    if (finalCurrentEmail) {
      if (!isValidEmail(finalCurrentEmail)) {
        setErrorMessage(`Format email "${finalCurrentEmail}" di input tidak valid.`);
        return;
      }
      if (!finalEmails.includes(finalCurrentEmail)) {
        finalEmails.push(finalCurrentEmail);
      }
      setCurrentEmail("");
    }

    if (!pesan.trim()) {
      setErrorMessage("Isi Email Undangan tidak boleh kosong.");
      return;
    }
    if (finalEmails.length === 0) {
      setErrorMessage("Tambahkan setidaknya satu alamat email peserta.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        exam_id: selectedExamId,
        pesan,
        emails: finalEmails,
        max_logins: maxLoginsNum,
      };

      const token = sessionStorage.getItem("adminToken");
      const response = await fetch(`${API_URL}/api/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      let result = {};
      const responseBodyText = await response.text();

      try {
        result = JSON.parse(responseBodyText);
      } catch (jsonError) {
        console.error("Gagal parse JSON:", jsonError, responseBodyText);
        throw new Error("Respons server tidak valid.");
      }

      if (!response.ok && response.status !== 207) {
        const msg =
          result.message ||
          (result.errors && result.errors.length > 0
            ? `Gagal: ${result.errors[0].reason}`
            : `Server error: ${response.status}`);
        throw new Error(msg);
      }

      setSuccessMessage(result.message || `Proses pengiriman selesai.`);
      setTimeout(() => setSuccessMessage(""), 7000);

      setEmails([]);
      setCurrentEmail("");
      setRefreshKey((prevKey) => prevKey + 1);
    } catch (error) {
      console.error("Error mengirim undangan:", error);
      setErrorMessage(error.message);
      setTimeout(() => setErrorMessage(""), 7000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col relative pb-10">
      {/* =========================================
          AREA NOTIFIKASI / TOAST
      ========================================== */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xl px-4 flex flex-col gap-2">
        {successMessage && (
          <div className="flex justify-between items-start bg-green-100 border border-green-200 text-green-800 px-5 py-3 rounded-lg shadow-lg animate-bounce-in">
            <div className="flex items-center gap-3">
              <FaCheckCircle className="text-green-600 w-5 h-5 flex-shrink-0" />
              <span className="font-semibold text-sm md:text-base leading-snug">
                {successMessage}
              </span>
            </div>
            <button
              onClick={() => setSuccessMessage("")}
              className="text-green-600 hover:text-green-800 ml-3"
            >
              <FaTimes />
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="flex justify-between items-start bg-red-100 border border-red-200 text-red-800 px-5 py-3 rounded-lg shadow-lg animate-bounce-in">
            <div className="flex items-center gap-3">
              <FaExclamationCircle className="text-red-600 w-5 h-5 flex-shrink-0" />
              <span className="font-semibold text-sm md:text-base leading-snug">
                {errorMessage}
              </span>
            </div>
            <button
              onClick={() => setErrorMessage("")}
              className="text-red-600 hover:text-red-800 ml-3"
            >
              <FaTimes />
            </button>
          </div>
        )}
      </div>

      <div className="bg-white shadow-sm border-b border-gray-300 py-4 pl-14 pr-4 md:px-8 md:py-5 sticky top-0 z-50 flex justify-between items-center transition-all">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <span className="hidden md:inline-flex">
            <FaPaperPlane className="text-blue-600 w-5 h-5 md:w-6 md:h-6" />
          </span>
          <span>Undang Peserta Ujian</span>
        </h2>

        <button
          onClick={() => setShowEmailSettings(true)}
          className="flex items-center gap-2 px-3 py-1.5 md:px-3 md:py-2 bg-white text-gray-600 rounded-md hover:bg-gray-50 hover:text-blue-600 transition text-xs md:text-sm font-medium border border-gray-300 shadow-sm"
          title="Konfigurasi Email Pengirim"
        >
          <FaCog /> <span className="hidden sm:inline">Pengaturan Email</span>
        </button>
      </div>

      {/* Konten Utama */}
      <div className="p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-8">
        {/* BAGIAN 1: FORM PENGIRIMAN */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
              <FaEnvelope className="text-gray-500" /> Form Undangan
            </h3>
          </div>

          <div className="p-4 sm:p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Grid untuk Pilihan Ujian & Batas Login */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label
                    htmlFor="ujian"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    <FaListUl className="inline-block mr-1 text-blue-500" />
                    Pilih Ujian
                  </label>
                  <div className="relative">
                    <select
                      id="ujian"
                      value={selectedExamId}
                      onChange={(e) => setSelectedExamId(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                      required
                      disabled={loadingUjian}
                    >
                      <option value="">
                        {loadingUjian
                          ? "Memuat daftar ujian..."
                          : "-- Pilih Keterangan Ujian --"}
                      </option>
                      {ujianList.map((ujian) => (
                        <option key={ujian.id} value={ujian.id}>
                          {ujian.keterangan}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="max_logins"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    <FaKey className="inline-block mr-1 text-yellow-500" />
                    Batas Akses Login
                  </label>
                  <input
                    type="number"
                    id="max_logins"
                    value={maxLogins}
                    onChange={(e) => setMaxLogins(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    min="1"
                    required
                  />
                </div>
              </div>

              {/* Grid untuk Pesan & Input Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Kiri: Textarea Pesan */}
                <div className="flex flex-col">
                  <label
                    htmlFor="pesan"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Isi Pesan Email
                  </label>
                  <textarea
                    id="pesan"
                    value={pesan}
                    onChange={(e) => setPesan(e.target.value)}
                    className="w-full flex-1 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none placeholder-gray-400"
                    placeholder="Tulis isi email undangan di sini..."
                    style={{ minHeight: "180px" }}
                    required
                  />
                </div>

                {/* Kanan: Input Email Dinamis (DENGAN FITUR PASTE) */}
                <div className="flex flex-col">
                  <label
                    htmlFor="currentEmail"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Daftar Email Peserta
                    <span className="text-xs font-normal text-gray-500 ml-2">
                      (Bisa paste banyak email sekaligus)
                    </span>
                  </label>

                  {/* Input + Tombol Tambah */}
                  <div className="flex gap-2 mb-3">
                    <div className="relative flex-1">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <FaEnvelope />
                      </span>
                      <input
                        type="text"
                        id="currentEmail"
                        value={currentEmail}
                        onChange={(e) => setCurrentEmail(e.target.value)}
                        onPaste={handlePaste}
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition placeholder-gray-400/70"
                        placeholder="masukan email peserta"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddEmail();
                          }
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddEmail}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-1"
                    >
                      <FaPlus /> Tambah
                    </button>
                  </div>

                  {/* List Email Container */}
                  <div
                    className="flex-1 border border-gray-200 rounded-lg bg-gray-50 p-2 overflow-y-auto"
                    style={{ maxHeight: "135px", minHeight: "135px" }}
                  >
                    {emails.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
                        <p>Belum ada email ditambahkan.</p>
                        <p className="text-xs mt-1">
                          Paste daftar email di kolom input atas.
                        </p>
                      </div>
                    ) : (
                      <ul className="space-y-1">
                        {emails.map((email, index) => (
                          <li
                            key={index}
                            className="flex justify-between items-center text-sm bg-white px-3 py-1.5 rounded border border-gray-200 shadow-sm animate-fade-in-up"
                          >
                            <span
                              className="text-gray-700 truncate mr-2"
                              title={email}
                            >
                              {email}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveEmail(index)}
                              className="text-gray-400 hover:text-red-500 p-1 transition"
                              title="Hapus"
                            >
                              <FaTimes />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    {emails.length} Email terdaftar
                  </p>
                </div>
              </div>

              {/* Tombol Submit */}
              <div className="pt-2 border-t border-gray-100 flex justify-end">
                <button
                  type="submit"
                  disabled={
                    loading ||
                    (emails.length === 0 && !currentEmail.trim()) ||
                    !selectedExamId
                  }
                  className={`flex justify-center items-center gap-2 px-8 py-3 rounded-lg text-white font-semibold shadow-md transition-all ${
                    loading ||
                    (emails.length === 0 && !currentEmail.trim()) ||
                    !selectedExamId
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg active:scale-95"
                  }`}
                >
                  {loading ? (
                    <>
                      <FaSyncAlt className="animate-spin" /> Mengirim...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane /> Kirim Undangan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* BAGIAN 2: RIWAYAT UNDANGAN */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <DaftarUndangan refreshTrigger={refreshKey} />
        </section>
      </div>

      {/* --- MODAL PENGATURAN EMAIL --- */}
      {showEmailSettings && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div
            className="absolute inset-0"
            onClick={() => setShowEmailSettings(false)}
          ></div>
          <div className="relative w-full max-w-2xl z-10">
            <EmailPengirim onClose={() => setShowEmailSettings(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default TambahPeserta;
