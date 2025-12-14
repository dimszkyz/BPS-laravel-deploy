// File: src/admin/LupaPassword.jsx
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUserShield,
  FaEnvelope,
  FaCommentDots,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaTimes,
  FaArrowLeft,
  FaWhatsapp,
} from "react-icons/fa";

import Header from "../component/header";

const API_URL = "https://kompeta.web.bps.go.id";
const FORGOT_PW_ENDPOINT = "/api/admin/forgot-password";

/** Notifikasi kecil (success / error) */
const Message = ({ type, text, onDismiss }) => {
  if (!text) return null;
  const isSuccess = type === "success";
  const bgColor = isSuccess ? "bg-green-50" : "bg-red-50";
  const textColor = isSuccess ? "text-green-700" : "text-red-700";
  const borderColor = isSuccess ? "border-green-200" : "border-red-200";
  const Icon = isSuccess ? FaCheckCircle : FaExclamationTriangle;

  return (
    <div
      className={`flex items-start p-3 mb-5 text-sm border rounded-xl ${bgColor} ${textColor} ${borderColor}`}
      role="alert"
    >
      <Icon className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
      <div className="flex-1">
        <span className="font-medium">{text}</span>
      </div>
      <button
        type="button"
        className={`ml-3 ${textColor} rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8 hover:bg-black/5`}
        onClick={onDismiss}
        aria-label="Tutup notifikasi"
        title="Tutup"
      >
        <FaTimes />
      </button>
    </div>
  );
};

const LupaPassword = () => {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState(""); // username / email
  const [whatsapp, setWhatsapp] = useState(""); // nomor whatsapp
  const [reason, setReason] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  // Placeholder untuk bgUrl agar footer tetap konsisten
  const bgUrl = null;

  const dismissMessage = useCallback(() => {
    setMsg({ type: "", text: "" });
  }, []);

  useEffect(() => {
    if (msg.text) {
      const t = setTimeout(dismissMessage, 4500);
      return () => clearTimeout(t);
    }
  }, [msg, dismissMessage]);

  const idError = !identifier.trim()
    ? "Username atau email wajib diisi."
    : "";

  const waError = !whatsapp.trim()
    ? "Nomor WhatsApp wajib diisi."
    : !/^\+?\d{9,15}$/.test(whatsapp.trim().replace(/\s/g, ""))
    ? "Format nomor WhatsApp tidak valid. Contoh: 08xxx / +628xxx"
    : "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    dismissMessage();

    if (idError || waError) {
      setMsg({ type: "error", text: idError || waError });
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch(`${API_URL}${FORGOT_PW_ENDPOINT}`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            // [PENTING] Header ini mencegah redirect 302 saat validasi gagal (CORS Fix)
            "Accept": "application/json" 
        },
        body: JSON.stringify({
          identifier: identifier.trim(),
          whatsapp: whatsapp.trim(),
          reason: reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mengirim permintaan.");

      setMsg({
        type: "success",
        text:
          data.message ||
          "Permintaan lupa password berhasil dikirim ke Superadmin.",
      });
      setIdentifier("");
      setWhatsapp("");
      setReason("");
    } catch (err) {
      setMsg({ type: "error", text: err.message || "Terjadi kesalahan." });
    } finally {
      setIsSending(false);
    }
  };

  const handleReset = () => {
    setIdentifier("");
    setWhatsapp("");
    setReason("");
    dismissMessage();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex flex-col">
      {/* HEADER */}
      <Header />

      {/* Konten */}
      <div className="p-6 flex-1">
        <div className="max-w-xl mx-auto">
          <Message {...msg} onDismiss={dismissMessage} />

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-gray-50/60 flex items-center gap-2">
              <FaEnvelope className="text-indigo-600" />
              <h2 className="text-base font-semibold text-gray-900">
                Form Permintaan Reset
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Username / Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username / Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <FaEnvelope />
                  </span>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2.5 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:text-gray-400/70 ${
                      idError
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-300 focus:border-indigo-500"
                    }`}
                    placeholder="username atau email anda disini"
                    autoComplete="username"
                  />
                </div>
                {!!idError && (
                  <p className="mt-1 text-xs text-red-600">{idError}</p>
                )}
              </div>

              {/* Nomor WhatsApp */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nomor WhatsApp
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <FaWhatsapp />
                  </span>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2.5 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:text-gray-400/70 ${
                      waError
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-300 focus:border-indigo-500"
                    }`}
                    placeholder="nomor whatssapp aktif"
                    autoComplete="tel"
                  />
                </div>
                {!!waError && (
                  <p className="mt-1 text-xs text-red-600">{waError}</p>
                )}
              </div>

              {/* Alasan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alasan / Keterangan (Opsional)
                </label>
                <div className="relative">
                  <span className="absolute top-3 left-3 text-gray-400">
                    <FaCommentDots />
                  </span>
                  <textarea
                    rows={4}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-gray-400/70"
                    placeholder="Misal: lupa password setelah ganti perangkat"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSending || !!idError || !!waError}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <FaCheckCircle />
                  )}
                  {isSending ? "Mengirim..." : "Kirim Permintaan"}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                >
                  Reset
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/admin/login")}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition inline-flex items-center justify-center gap-2"
                >
                  <FaArrowLeft />
                  Kembali ke Login
                </button>
              </div>

              <div className="mt-2 text-xs text-gray-500">
                Setelah permintaan dikirim, Superadmin akan mengubah password akunmu.
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer
        className={`w-full mt-8 border-t border-gray-200 ${
          bgUrl ? "bg-white/80" : "bg-white"
        } py-3`}
      >
        <div className="max-w-7xl mx-auto text-center text-[12px] text-gray-500">
          © {new Date().getFullYear()} BPS Kota Salatiga. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LupaPassword;