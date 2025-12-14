// File: src/admin/UbahPassword.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  FaKey,
  FaEye,
  FaEyeSlash,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimes,
  FaShieldAlt,
  FaLock,
  FaCog,
} from "react-icons/fa";
import { jwtDecode } from "jwt-decode";
import PermintaanResetPassword from "./PermintaanResetPassword";
import EmailPengirim from "./EmailPengirim";

const API_URL = "https://kompeta.web.bps.go.id";
const CHANGE_PW_ENDPOINT = "/api/admin/change-password";

// Komponen Pesan Notifikasi (Memoized)
const MemoizedMessage = ({ type, text, onDismiss }) => {
  if (!text) return null;
  const isSuccess = type === "success";
  const bgColor = isSuccess ? "bg-green-50" : "bg-red-50";
  const textColor = isSuccess ? "text-green-700" : "text-red-700";
  const borderColor = isSuccess ? "border-green-200" : "border-red-200";
  const Icon = isSuccess ? FaCheckCircle : FaExclamationTriangle;

  return (
    <div
      className={`flex items-start p-4 mb-6 text-sm border rounded-xl shadow-sm ${bgColor} ${textColor} ${borderColor} transition-all duration-300 animate-fade-in-down`}
      role="alert"
    >
      <Icon className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
      <div className="flex-1">
        <span className="font-medium">{text}</span>
      </div>
      <button
        type="button"
        className={`ml-3 ${textColor} rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8 hover:bg-black/5 transition-colors`}
        onClick={onDismiss}
        aria-label="Tutup notifikasi"
        title="Tutup"
      >
        <FaTimes />
      </button>
    </div>
  );
};

// Utilitas Kekuatan Password
const strengthLabel = (s) => {
  switch (s) {
    case 0:
    case 1:
      return "Sangat lemah";
    case 2:
      return "Lemah";
    case 3:
      return "Cukup";
    case 4:
      return "Kuat";
    default:
      return "-";
  }
};

const calcStrength = (pw) => {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
};

const UbahPassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConf, setShowConf] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  // ✅ Cek role login
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const dismissMessage = useCallback(() => {
    setMsg({ type: "", text: "" });
  }, []);

  useEffect(() => {
    if (msg.text) {
      const t = setTimeout(dismissMessage, 4500);
      return () => clearTimeout(t);
    }
  }, [msg, dismissMessage]);

  // Detect role dari adminData atau JWT
  useEffect(() => {
    try {
      const adminDataRaw = sessionStorage.getItem("adminData");
      if (adminDataRaw) {
        const adminData = JSON.parse(adminDataRaw);
        const role = (adminData?.role || "").toLowerCase();
        setIsSuperadmin(role === "superadmin");
        return;
      }
      const token = sessionStorage.getItem("adminToken");
      if (token) {
        const decoded = jwtDecode(token);
        const role = (decoded?.role || "").toLowerCase();
        setIsSuperadmin(role === "superadmin");
      }
    } catch {
      setIsSuperadmin(false);
    }
  }, []);

  const pwLenError =
    newPassword && newPassword.length < 6
      ? "Password baru minimal 6 karakter."
      : "";
  const pwSameError =
    currentPassword && newPassword && currentPassword === newPassword
      ? "Password baru tidak boleh sama dengan password lama."
      : "";
  const pwMatchError =
    confirmNewPassword && newPassword !== confirmNewPassword
      ? "Konfirmasi password baru tidak sama."
      : "";

  const formIncomplete = !currentPassword || !newPassword || !confirmNewPassword;
  const pwStrength = calcStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dismissMessage();

    if (formIncomplete) {
      setMsg({ type: "error", text: "Semua field wajib diisi." });
      return;
    }
    if (pwLenError || pwSameError || pwMatchError) {
      setMsg({ type: "error", text: "Periksa kembali input password." });
      return;
    }

    const token = sessionStorage.getItem("adminToken");
    if (!token) {
      setMsg({
        type: "error",
        text: "Token admin tidak ditemukan. Silakan login ulang.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}${CHANGE_PW_ENDPOINT}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mengubah password.");

      setMsg({
        type: "success",
        text: data.message || "Password berhasil diubah.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setShowCur(false);
      setShowNew(false);
      setShowConf(false);
    } catch (err) {
      setMsg({ type: "error", text: err.message || "Terjadi kesalahan." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setShowCur(false);
    setShowNew(false);
    setShowConf(false);
    dismissMessage();
  };

  // ✅ Container Width: Superadmin lebih lebar (max-w-7xl), Admin biasa (max-w-2xl)
  const containerClass = isSuperadmin
    ? "max-w-7xl mx-auto w-full"
    : "max-w-2xl mx-auto w-full";

  // ✅ FORM CARD (Komponen UI)
  const FormUbahPassword = (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden h-full flex flex-col">
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <FaShieldAlt />
        </div>
        <h2 className="text-base font-bold text-gray-900">
          Form Ubah Password
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-5 flex-1">
        {/* Password Lama */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Password Lama
          </label>
          <div className="relative group">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 group-focus-within:text-indigo-500 transition-colors">
              <FaLock />
            </span>
            <input
              type={showCur ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder="Masukkan password lama"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowCur((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showCur ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        {/* Password Baru */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Password Baru
          </label>
          <div className="relative group">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 group-focus-within:text-indigo-500 transition-colors">
              <FaKey />
            </span>
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`block w-full pl-10 pr-10 py-2.5 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                pwLenError || pwSameError
                  ? "border-red-300 focus:border-red-500"
                  : "border-gray-300 focus:border-indigo-500"
              }`}
              placeholder="Minimal 6 karakter"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showNew ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {!!pwLenError && (
            <p className="mt-1 text-xs text-red-600 font-medium">{pwLenError}</p>
          )}
          {!!pwSameError && (
            <p className="mt-1 text-xs text-red-600 font-medium">{pwSameError}</p>
          )}

          {/* Strength bar */}
          <div className="mt-3">
            <div className="flex gap-1.5 h-1.5 mb-1.5">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-full transition-all duration-300 ${
                    pwStrength > i ? "bg-indigo-500" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between items-center text-xs text-gray-500">
               <span>Kekuatan: <span className="font-semibold text-indigo-600">{strengthLabel(pwStrength)}</span></span>
            </div>
          </div>
        </div>

        {/* Konfirmasi Password Baru */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Konfirmasi Password Baru
          </label>
          <div className="relative group">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 group-focus-within:text-indigo-500 transition-colors">
              <FaKey />
            </span>
            <input
              type={showConf ? "text" : "password"}
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className={`block w-full pl-10 pr-10 py-2.5 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                pwMatchError
                  ? "border-red-300 focus:border-red-500"
                  : "border-gray-300 focus:border-indigo-500"
              }`}
              placeholder="Ulangi password baru"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConf((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showConf ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {!!pwMatchError && (
            <p className="mt-1 text-xs text-red-600 font-medium">{pwMatchError}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-gray-100 mt-auto">
          <button
            type="submit"
            disabled={
              isSaving ||
              formIncomplete ||
              !!pwLenError ||
              !!pwSameError ||
              !!pwMatchError
            }
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 active:bg-indigo-800 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isSaving ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaCheckCircle />
            )}
            {isSaving ? "Menyimpan..." : "Simpan Password"}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            Reset
          </button>
        </div>

        {/* Hint */}
        <div className="mt-3 p-3 bg-blue-50 rounded-lg text-xs text-blue-700 flex items-start gap-2 border border-blue-100">
          <FaExclamationTriangle className="mt-0.5 flex-shrink-0" />
          <p>
            Gunakan password baru anda saat login berikutnya demi keamanan akun.
          </p>
        </div>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      
      <div className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 py-4 px-4 md:px-8 sticky top-0 z-40 flex justify-between items-center transition-all">
        
        {/* Bagian Kiri: Judul & Icon */}
        <div className="flex items-center gap-3 pl-10 md:pl-0">
          {/* Icon (Hidden di Mobile) */}
          <div className="hidden md:flex w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white items-center justify-center shadow-md shadow-indigo-200">
            <FaKey />
          </div>
          
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
              Ubah Password
            </h1>
            <p className="hidden md:block text-sm text-gray-500">
              Kelola keamanan akun dan akses sistem anda.
            </p>
          </div>
        </div>

        {/* Bagian Kanan: Tombol Pengaturan Email */}
        <button
          onClick={() => setShowEmailModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:text-blue-600 transition shadow-sm text-sm"
        >
          <FaCog /> 
          <span className="hidden sm:inline">Pengaturan Email</span>
        </button>

      </div>

      {/* Konten Utama */}
      <div className="p-4 md:p-6 lg:p-8">
        <div className={containerClass}>
          
          <MemoizedMessage {...msg} onDismiss={dismissMessage} />

          {/* ✅ LOGIC UTAMA RESPONSIVE SUPERADMIN */}
          {isSuperadmin ? (
            // Grid System:
            // Mobile: 1 kolom
            // Large Screen (lg): 12 kolom (Form 5, Table 7)
            // Extra Large (xl): 12 kolom (Form 4, Table 8) -> Tabel lebih luas
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* KOLOM KIRI: Form Ubah Password */}
              <div className="lg:col-span-5 xl:col-span-4 w-full">
                {FormUbahPassword}
              </div>

              {/* KOLOM KANAN: Permintaan Reset (Lebih lebar) */}
              <div className="lg:col-span-7 xl:col-span-8 w-full min-w-0">
                 {/* Wrapper tambahan untuk memastikan tabel tidak overflow layout */}
                 <div className="h-full">
                    <PermintaanResetPassword />
                 </div>
              </div>

            </div>
          ) : (
            
            /* ✅ Tampilan Admin Biasa (Tengah) */
            <div className="flex justify-center">
              <div className="w-full max-w-lg">
                {FormUbahPassword}
              </div>
            </div>
          )}

        </div>
      </div>
      {showEmailModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          {/* Wrapper agar lebar modal pas */}
          <div className="w-full max-w-2xl relative">
             <EmailPengirim onClose={() => setShowEmailModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default UbahPassword;