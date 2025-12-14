// File: src/admin/Pengaturan.jsx

import React, { useState, useEffect, useCallback } from "react";
import {
  FaCog,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimes,
  FaCamera,
  FaSpinner,
  FaFileImage,
  FaFont,
  FaPaintBrush,
} from "react-icons/fa";
import ImageUploadBox from "./ImageUploadBox";

const API_URL = "https://kompeta.web.bps.go.id";

/** Komponen Notifikasi Halaman */
const PageAlert = ({ type, text, onClose }) => {
  if (!text) return null;
  const isSuccess = type === "success";
  const bg = isSuccess ? "bg-green-50" : "bg-red-50";
  const fg = isSuccess ? "text-green-700" : "text-red-700";
  const br = isSuccess ? "border-green-200" : "border-red-200";
  const Icon = isSuccess ? FaCheckCircle : FaExclamationTriangle;

  return (
    <div
      className={`flex items-start p-3 mb-4 text-sm border rounded-xl ${bg} ${fg} ${br}`}
      role="alert"
    >
      <Icon className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
      <div className="flex-1">
        <span className="font-medium">{text}</span>
      </div>
      <button
        type="button"
        onClick={onClose}
        className={`ml-3 ${fg} rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8 hover:bg-black/5`}
        aria-label="Tutup notifikasi"
        title="Tutup"
      >
        <FaTimes />
      </button>
    </div>
  );
};

const Pengaturan = () => {
  // State tampilan
  const [settings, setSettings] = useState({
    adminBgImage: "",
    pesertaBgImage: "",
    headerLogo: "",
    headerText: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  // Default background kelas untuk placeholder
  const defaultBgAdmin = "bg-gray-50";
  const defaultBgPeserta = "bg-gray-50";
  const defaultBgLogo = "bg-gray-100";

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/settings`);
      if (!res.ok) throw new Error("Gagal memuat data pengaturan");
      const data = await res.json();

      setSettings({
        adminBgImage: data.adminBgImage || "",
        pesertaBgImage: data.pesertaBgImage || "",
        headerLogo: data.headerLogo || "",
        headerText: data.headerText || "",
      });
    } catch (err) {
      setMsg({ type: "error", text: err.message || "Gagal memuat pengaturan." });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Auto dismiss alert
  useEffect(() => {
    if (msg.text) {
      const t = setTimeout(() => setMsg({ type: "", text: "" }), 5000);
      return () => clearTimeout(t);
    }
  }, [msg]);

  // Simpan pengaturan tampilan
  const handleSave = async (e) => {
    e?.preventDefault?.();
    setIsSaving(true);
    setMsg({ type: "", text: "" });

    const token = sessionStorage.getItem("adminToken");
    const formData = new FormData();

    // adminBgImage
    if (settings.adminBgImage instanceof File) {
      formData.append("adminBgImage", settings.adminBgImage);
    } else {
      formData.append("adminBgImage_text", settings.adminBgImage);
    }

    // pesertaBgImage
    if (settings.pesertaBgImage instanceof File) {
      formData.append("pesertaBgImage", settings.pesertaBgImage);
    } else {
      formData.append("pesertaBgImage_text", settings.pesertaBgImage);
    }

    // headerLogo
    if (settings.headerLogo instanceof File) {
      formData.append("headerLogo", settings.headerLogo);
    } else {
      formData.append("headerLogo_text", settings.headerLogo);
    }

    // headerText
    formData.append("headerText", settings.headerText);

    try {
      const res = await fetch(`${API_URL}/api/settings`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menyimpan");

      setMsg({ type: "success", text: "Pengaturan tampilan berhasil disimpan!" });
      await fetchSettings();
    } catch (error) {
      console.error("Gagal menyimpan pengaturan tampilan:", error);
      setMsg({
        type: "error",
        text: error.message || "Gagal menyimpan pengaturan. Coba lagi.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset field tertentu (mis. hapus gambar)
  const handleReset = (key) => {
    setSettings((prev) => ({ ...prev, [key]: "" }));
  };

  // Handler perubahan file (dari ImageUploadBox)
  const handleFileChange = (key, file) => {
    setSettings((prev) => ({ ...prev, [key]: file }));
  };

  // Handler teks biasa
  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  if (isLoading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <FaSpinner className="animate-spin text-4xl text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-10">
      
      {/* ===========================
          NAVBAR (Sticky Top)
      ============================ */}
      <div className="bg-white shadow-sm border-b border-gray-300 py-4 pl-14 pr-4 md:px-8 md:py-5 sticky top-0 z-50 flex items-center gap-3 transition-all">
        {/* Icon disembunyikan di mobile (hidden), hanya muncul di md ke atas */}
        <span className="hidden md:inline-block">
          <FaCog className="text-blue-600 w-5 h-5 md:w-6 md:h-6" />
        </span>
        <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
          Pengaturan
        </h2>
      </div>

      <div className="p-4 md:p-6 lg:p-8">
        <PageAlert {...msg} onClose={() => setMsg({ type: "", text: "" })} />

        {/* ========================================= */}
        {/* BAGIAN: PENGATURAN TAMPILAN               */}
        {/* ========================================= */}
        <section id="tampilan-section" className="mb-8">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
            <div className="px-5 py-4 border-b flex items-center gap-2">
              <FaPaintBrush className="text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Pengaturan Tampilan
              </h2>
            </div>

            <form onSubmit={handleSave} className="p-5">
              <p className="text-sm text-gray-600 mb-4">
                Atur logo, teks header, dan latar belakang halaman login.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Kartu: Header Global */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
                  <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <FaFileImage className="text-indigo-500" /> Header Global
                  </h3>
                  <p className="text-xs text-gray-600 mb-4">
                    Logo & teks muncul di seluruh halaman aplikasi.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Logo Header
                      </label>
                      <ImageUploadBox
                        value={settings.headerLogo}
                        onChange={(file) => handleFileChange("headerLogo", file)}
                        onReset={() => handleReset("headerLogo")}
                        defaultBgClass={defaultBgLogo}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="headerText"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Teks Header
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaFont className="text-gray-400" />
                        </div>
                        <input
                          type="text"
                          id="headerText"
                          name="headerText"
                          value={settings.headerText}
                          onChange={handleTextChange}
                          className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          placeholder="Contoh: Ujian BPS Kota Salatiga"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Kartu: Latar Login Admin */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
                  <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <FaCamera className="text-indigo-500" /> Latar Login Admin
                  </h3>
                  <p className="text-xs text-gray-600 mb-4">
                    Unggah gambar atau reset ke default.
                  </p>

                  <div className="flex-grow">
                    <ImageUploadBox
                      value={settings.adminBgImage}
                      onChange={(file) =>
                        handleFileChange("adminBgImage", file)
                      }
                      onReset={() => handleReset("adminBgImage")}
                      defaultBgClass={defaultBgAdmin}
                    />
                  </div>
                </div>

                {/* Kartu: Latar Login Peserta */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
                  <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <FaCamera className="text-indigo-500" /> Latar Login Peserta
                  </h3>
                  <p className="text-xs text-gray-600 mb-4">
                    Unggah gambar atau reset ke default.
                  </p>

                  <div className="flex-grow">
                    <ImageUploadBox
                      value={settings.pesertaBgImage}
                      onChange={(file) =>
                        handleFileChange("pesertaBgImage", file)
                      }
                      onReset={() => handleReset("pesertaBgImage")}
                      defaultBgClass={defaultBgPeserta}
                    />
                  </div>
                </div>
              </div>

              {/* Bar aksi (Responsive) */}
              <div className="mt-8 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 border-t pt-5 border-gray-100">
                {/* Tombol Reset */}
                <button
                  type="button"
                  onClick={fetchSettings}
                  disabled={isSaving}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 font-medium transition text-sm sm:text-base"
                  title="Batalkan perubahan (muat ulang dari server)"
                >
                  Reset
                </button>

                {/* Tombol Simpan */}
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-200 text-sm sm:text-base"
                >
                  {isSaving ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <FaCheckCircle />
                  )}
                  {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Pengaturan;