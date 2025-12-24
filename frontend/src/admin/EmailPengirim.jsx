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

const API_URL = "http://localhost:8000";

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

  // Daftar Provider SMTP
  const providers = [
    { name: "Tanpa Layanan (Simpan ke DB saja)", value: "none", host: "", port: 0 },
    { name: "Google / Gmail", value: "gmail", host: "smtp.gmail.com", port: 587 },
    { name: "Brevo (Sendinblue)", value: "brevo", host: "smtp-relay.brevo.com", port: 587 },
    { name: "Mailtrap", value: "mailtrap", host: "sandbox.smtp.mailtrap.io", port: 2525 },
    { name: "Lainnya (Manual SMTP Hosting)", value: "custom", host: "", port: 587 },
  ];

  // Ambil pengaturan SMTP
  const fetchSmtpSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = sessionStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/api/email/smtp`, {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json" // [PENTING] Agar error 500 jadi JSON
        },
      });
      
      const responseText = await res.text(); // Ambil text dulu untuk debug
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error("Server Error: Respon bukan JSON. Cek console.");
      }

      if (!res.ok) throw new Error(data.message || "Gagal memuat pengaturan SMTP");
      
      if (data) {
        setSmtpSettings(prev => ({
          ...prev,
          ...data,
          // Pastikan service default 'gmail' jika null
          service: data.service || "gmail" 
        }));
      }
    } catch (err) {
      console.error("Info SMTP:", err.message);
      // Jangan tampilkan error ke user jika hanya gagal load awal (biarkan form kosong/default)
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSmtpSettings();
  }, [fetchSmtpSettings]);

  // Handle perubahan dropdown
  const handleServiceChange = (e) => {
    const selectedValue = e.target.value;
    const provider = providers.find(p => p.value === selectedValue);
    
    setSmtpSettings(prev => ({
      ...prev,
      service: selectedValue,
      host: provider.host || prev.host,
      port: provider.port || prev.port,
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

  // Simpan konfigurasi
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
          "Accept": "application/json", // [PENTING]
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(smtpSettings),
      });

      const responseText = await res.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        // Jika backend error 500 HTML, kita tangkap di sini
        console.error("Raw Response:", responseText);
        throw new Error("Terjadi kesalahan di Server (500). Cek 'service' column di DB.");
      }

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
        {msg.text && (
          <div className={`mb-4 p-3 rounded-md text-sm flex items-center gap-2 ${msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {msg.type === "success" ? <FaCheckCircle /> : <FaExclamationTriangle />}
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          
          {/* Service Selection */}
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

          {/* Info Box */}
          {smtpSettings.service !== "none" && (
            <div className="p-3 bg-blue-50 text-blue-800 text-xs rounded-md border border-blue-200 flex items-start gap-2 animate-fadeIn">
              <FaInfoCircle className="flex-shrink-0 mt-0.5 text-blue-500" />
              <div>
                {smtpSettings.service === "gmail" && (
                  <ul className="list-disc list-inside space-y-1">
                    <li>Username: Email Gmail lengkap.</li>
                    <li>Password: <b>App Password</b> (16 digit).</li>
                  </ul>
                )}
                {smtpSettings.service === "brevo" && (
                   <ul className="list-disc list-inside space-y-1">
                    <li>Username: Email login Brevo.</li>
                    <li>Password: <b>SMTP Key</b> (bukan password login).</li>
                   </ul>
                )}
                {smtpSettings.service === "mailtrap" && "Gunakan kredensial dari Inbox Mailtrap."}
                {smtpSettings.service === "custom" && "Gunakan kredensial SMTP hosting Anda."}
              </div>
            </div>
          )}

          {/* From Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pengirim</label>
            <div className="relative">
              <FaUser className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                name="from_name"
                value={smtpSettings.from_name}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
              <div className="relative">
                <FaServer className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  name="host"
                  value={smtpSettings.host}
                  onChange={handleChange}
                  disabled={smtpSettings.service !== "custom"}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition"
                  required={smtpSettings.service !== "none"}
                />
              </div>
            </div>

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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username / Email SMTP</label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  name="auth_user"
                  value={smtpSettings.auth_user}
                  onChange={handleChange}
                  disabled={smtpSettings.service === "none"}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition"
                  required={smtpSettings.service !== "none"}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password / Key</label>
              <div className="relative">
                <FaLock className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="password"
                  name="auth_pass"
                  value={smtpSettings.auth_pass}
                  onChange={handleChange}
                  disabled={smtpSettings.service === "none"}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono disabled:bg-gray-100 disabled:cursor-not-allowed transition"
                  placeholder="••••••••••••"
                  required={smtpSettings.service !== "none"}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 gap-2">
            {onClose && (
              <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 font-semibold transition">
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