// File: src/admin/EmailPengirim.jsx

import React, { useState, useEffect, useCallback } from "react";
import {
  FaEnvelope,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaSave,
  FaInfoCircle,
} from "react-icons/fa";

const API_URL = "https://kompeta.web.bps.go.id";

const EmailPengirim = ({ onClose }) => {
  const [smtpSettings, setSmtpSettings] = useState({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth_user: "",
    auth_pass: "",
    from_name: "Admin Ujian",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  // Fetch SMTP Settings
  const fetchSmtpSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = sessionStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/api/email/smtp`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Gagal memuat pengaturan SMTP");
      const data = await res.json();
      setSmtpSettings({
        service: "gmail", // Selalu set ke 'gmail'
        host: data.host || "smtp.gmail.com",
        port: data.port || 587,
        secure: !!data.secure,
        auth_user: data.auth_user || "",
        auth_pass: data.auth_pass || "",
        from_name: data.from_name || "Admin Ujian",
      });
    } catch (err) {
      console.error("Info SMTP:", err.message); 
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSmtpSettings();
  }, [fetchSmtpSettings]);

  // Handle Change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSmtpSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle Save
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMsg({ type: "", text: "" });

    // Pastikan service selalu 'gmail' saat menyimpan
    const settingsToSave = {
      ...smtpSettings,
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
    };

    const token = sessionStorage.getItem("adminToken");
    try {
      const res = await fetch(`${API_URL}/api/email/smtp`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settingsToSave),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menyimpan SMTP");

      setMsg({ type: "success", text: "Pengaturan email berhasil disimpan!" });
    } catch (error) {
      setMsg({ type: "error", text: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <FaSpinner className="animate-spin text-3xl text-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <FaEnvelope className="text-blue-600" />
          Konfigurasi Email Pengirim (Gmail)
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            &times;
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-6">
        {/* Notifikasi */}
        {msg.text && (
          <div
            className={`mb-4 p-3 rounded-md text-sm flex items-center gap-2 ${
              msg.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {msg.type === "success" ? (
              <FaCheckCircle />
            ) : (
              <FaExclamationTriangle />
            )}
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* KETERANGAN APP PASSWORD GMAIL (Selalu tampil) */}
          <div className="p-3 bg-blue-50 text-blue-800 text-xs rounded-md border border-blue-200 flex items-start gap-2">
            <FaInfoCircle className="flex-shrink-0 mt-0.5 text-blue-500" />
            <div>
              <p className="font-semibold mb-1">Penting untuk Gmail:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Jangan gunakan password akun Google biasa Anda.</li>
                <li>
                  Anda wajib menggunakan <b>App Password</b>.
                </li>
                <li>
                  Aktifkan 2-Step Verification di akun Google Anda terlebih
                  dahulu.
                </li>
                <li>
                  Buat App Password di sini:{" "}
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-medium hover:text-blue-900"
                  >
                    https://myaccount.google.com/apppasswords
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Nama Pengirim */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Pengirim (di Email Peserta)
            </label>
            <input
              type="text"
              name="from_name"
              value={smtpSettings.from_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
              placeholder="Contoh: Panitia Ujian BPS"
            />
          </div>

          {/* Email & Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Pengirim (Gmail)
              </label>
              <input
                type="email"
                name="auth_user"
                value={smtpSettings.auth_user}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
                placeholder="email@gmail.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password Aplikasi (App Password)
              </label>
              <input
                type="password"
                name="auth_pass"
                value={smtpSettings.auth_pass}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono placeholder:text-gray-400"
                placeholder="password dari google"
                required
              />
            </div>
          </div>

          {/* Tombol Simpan */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <FaSpinner className="animate-spin" /> Menyimpan...
                </>
              ) : (
                <>
                  <FaSave /> Simpan Konfigurasi
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmailPengirim;