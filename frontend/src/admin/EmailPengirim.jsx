// File: src/admin/EmailPengirim.jsx

import React, { useState, useEffect, useCallback } from "react";
import {
  FaEnvelope,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaSave,
  FaInfoCircle,
  FaServer,
  FaHashtag,
  FaLock,
  FaUser,
  FaCogs
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

  // Daftar Provider SMTP untuk pengisian otomatis
  const providers = [
    { name: "Tanpa Layanan (Simpan ke DB saja)", value: "none", host: "", port: 0 },
    { name: "Google / Gmail", value: "gmail", host: "smtp.gmail.com", port: 587 },
    { name: "Brevo (Sendinblue)", value: "brevo", host: "smtp-relay.brevo.com", port: 587 },
    { name: "Mailtrap", value: "mailtrap", host: "sandbox.smtp.mailtrap.io", port: 2525 },
    { name: "Lainnya (Manual SMTP Hosting)", value: "custom", host: "", port: 587 },
  ];

  // Ambil pengaturan SMTP dari database saat komponen dimuat
  const fetchSmtpSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = sessionStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/api/email/smtp`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Gagal memuat pengaturan SMTP");
      const data = await res.json();
      
      if (data && data.service) {
        setSmtpSettings(data);
      }
    } catch (err) {
      console.error("Info SMTP:", err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSmtpSettings();
  }, [fetchSmtpSettings]);

  // Handle perubahan dropdown layanan
  const handleServiceChange = (e) => {
    const selectedValue = e.target.value;
    const provider = providers.find(p => p.value === selectedValue);
    
    setSmtpSettings(prev => ({
      ...prev,
      service: selectedValue,
      host: provider.host || prev.host,
      port: provider.port || prev.port,
      // Reset user/pass jika memilih 'none' agar bersih (opsional)
      auth_user: selectedValue === "none" ? "" : prev.auth_user,
      auth_pass: selectedValue === "none" ? "" : prev.auth_pass,
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSmtpSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Simpan konfigurasi ke database
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMsg({ type: "", text: "" });

    const token = sessionStorage.getItem("adminToken");
    try {
      const res = await fetch(`${API_URL}/api/email/smtp`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(smtpSettings),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menyimpan SMTP");

      setMsg({ type: "success", text: "Pengaturan email berhasil disimpan!" });
      if (onClose) setTimeout(() => onClose(), 2000);
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
          Konfigurasi Email Pengirim
        </h3>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        )}
      </div>

      <div className="p-6">
        {/* Notifikasi Status */}
        {msg.text && (
          <div className={`mb-4 p-3 rounded-md text-sm flex items-center gap-2 ${msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {msg.type === "success" ? <FaCheckCircle /> : <FaExclamationTriangle />}
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          
          {/* 1. Dropdown Pilihan Layanan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Layanan Email</label>
            <div className="relative">
              <FaCogs className="absolute left-3 top-3 text-gray-400" />
              <select
                name="service"
                value={smtpSettings.service}
                onChange={handleServiceChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer"
              >
                {providers.map((p) => (
                  <option key={p.value} value={p.value}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Catatan Dinamis Berdasarkan Layanan */}
          {smtpSettings.service !== "none" && (
            <div className="p-3 bg-blue-50 text-blue-800 text-xs rounded-md border border-blue-200 flex items-start gap-2 animate-fadeIn">
              <FaInfoCircle className="flex-shrink-0 mt-0.5 text-blue-500" />
              <div>
                {smtpSettings.service === "gmail" && (
                  <>
                    <p className="font-semibold mb-1 text-red-600 text-sm">Panduan Gmail (Google):</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Username: Alamat email Gmail lengkap Anda.</li>
                      <li>Password: <b>App Password</b> (16 digit), bukan password email biasa.</li>
                      <li>Aktifkan Verifikasi 2 Langkah untuk membuat Sandi Aplikasi.</li>
                      <li>Buat di: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-blue-900">Google App Passwords</a></li>
                    </ul>
                  </>
                )}
                {smtpSettings.service === "brevo" && (
                  <>
                    <p className="font-semibold mb-1 text-indigo-700 text-sm">Panduan Brevo (Sendinblue):</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Username: Alamat email yang terdaftar di Brevo.</li>
                      <li>Password: <b>SMTP Key</b> dari Dashboard Brevo (Menu SMTP & API).</li>
                      <li>Pastikan pengirim sudah diverifikasi di bagian "Sender".</li>
                    </ul>
                  </>
                )}
                {smtpSettings.service === "mailtrap" && (
                  <>
                    <p className="font-semibold mb-1 text-amber-700 text-sm">Panduan Mailtrap (Testing):</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Gunakan <b>Username</b> & <b>Password</b> dari Inbox Setup di Mailtrap.</li>
                      <li>Layanan ini hanya untuk simulasi; email tidak terkirim ke alamat asli.</li>
                    </ul>
                  </>
                )}
                {smtpSettings.service === "custom" && (
                  <>
                    <p className="font-semibold mb-1 text-emerald-700 text-sm">Panduan SMTP Hosting Manual:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Username: Alamat email lengkap hosting (contoh: <i>admin@domain.com</i>).</li>
                      <li>Password: Password akun email tersebut (<b>Bukan</b> password database/cPanel).</li>
                      <li>Host: Biasanya <i>mail.domain.com</i> atau <i>smtp.domain.com</i>.</li>
                      <li>Port: <b>465</b> (SSL) atau <b>587</b> (TLS).</li>
                    </ul>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 3. Nama Pengirim */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pengirim (Display Name)</label>
            <div className="relative">
              <FaUser className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                name="from_name"
                value={smtpSettings.from_name}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Contoh: Panitia Ujian Sekolah"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SMTP Host */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
              <div className="relative">
                <FaServer className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  name="host"
                  value={smtpSettings.host}
                  onChange={handleChange}
                  // Disable jika 'none' atau bukan 'custom'
                  disabled={smtpSettings.service !== "custom"}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition"
                  required={smtpSettings.service !== "none"}
                />
              </div>
            </div>

            {/* SMTP Port */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
              <div className="relative">
                <FaHashtag className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="number"
                  name="port"
                  value={smtpSettings.port}
                  onChange={handleChange}
                  disabled={smtpSettings.service !== "custom"}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition"
                  required={smtpSettings.service !== "none"}
                />
              </div>
            </div>

            {/* Username / Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username / Email SMTP</label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  name="auth_user"
                  value={smtpSettings.auth_user}
                  onChange={handleChange}
                  // [PERUBAHAN] Disabled jika service === 'none'
                  disabled={smtpSettings.service === "none"}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="admin@domain.com"
                  // [PERUBAHAN] Tidak required jika service === 'none'
                  required={smtpSettings.service !== "none"}
                />
              </div>
            </div>

            {/* Password Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password Email / Key</label>
              <div className="relative">
                <FaLock className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="password"
                  name="auth_pass"
                  value={smtpSettings.auth_pass}
                  onChange={handleChange}
                  // [PERUBAHAN] Disabled jika service === 'none'
                  disabled={smtpSettings.service === "none"}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="••••••••••••"
                  // [PERUBAHAN] Tidak required jika service === 'none'
                  required={smtpSettings.service !== "none"}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end pt-4 gap-2">
            {onClose && (
              <button 
                type="button" 
                onClick={onClose} 
                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 font-semibold transition"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition shadow-sm disabled:opacity-50"
            >
              {isSaving ? <><FaSpinner className="animate-spin" /> Menyimpan...</> : <><FaSave /> Simpan Konfigurasi</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmailPengirim;