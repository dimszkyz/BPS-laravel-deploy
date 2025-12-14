import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaKey, FaSignInAlt, FaSpinner } from "react-icons/fa";

const API_URL = "https://kompeta.web.bps.go.id";
const defaultBgPeserta = "bg-gray-50";

const LoginPeserta = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loginCode, setLoginCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const [bgUrl, setBgUrl] = useState("");
  const [bgLoading, setBgLoading] = useState(true);

  // --- LOGIKA AUTO-REDIRECT (BARU) ---
  useEffect(() => {
    // 1. Cek apakah ada data login tersimpan
    const loginDataStr = localStorage.getItem("loginPeserta");
    const pesertaDataStr = localStorage.getItem("pesertaData");

    if (loginDataStr) {
      try {
        const loginData = JSON.parse(loginDataStr);
        
        // Jika data login valid dan punya ID Ujian
        if (loginData && loginData.examId) {
          
          // 2. Cek Level Akses
          if (pesertaDataStr) {
            // Level 2: Sudah Login + Sudah Isi Data Diri -> Langsung ke Ujian
            console.log("Sesi ditemukan, mengarahkan kembali ke ujian...");
            navigate(`/ujian/${loginData.examId}`, { replace: true });
          } else {
            // Level 1: Sudah Login tapi Belum Isi Data -> Ke Form Data Diri
            console.log("Sesi login ditemukan, mengarahkan ke pengisian data...");
            navigate("/peserta", { replace: true });
          }
        }
      } catch (e) {
        // Jika JSON error, hapus storage agar bersih
        console.error("Data storage korup, mereset sesi.", e);
        localStorage.removeItem("loginPeserta");
        localStorage.removeItem("pesertaData");
      }
    }
  }, [navigate]);
  // --- SELESAI LOGIKA BARU ---

  useEffect(() => {
    const fetchBgSetting = async () => {
      try {
        const res = await fetch(`${API_URL}/api/settings`);
        const data = await res.json();
        if (data.pesertaBgImage) {
          setBgUrl(`${API_URL}${data.pesertaBgImage}`);
        }
      } catch (err) {
        console.error("Gagal memuat BG Peserta:", err);
      } finally {
        setBgLoading(false);
      }
    };
    fetchBgSetting();
  }, []);

  const validate = () => {
    if (!email.trim() || !loginCode.trim()) {
      setErrMsg("Email dan Kode Login wajib diisi.");
      return false;
    }
    const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!okEmail) {
      setErrMsg("Format email tidak valid.");
      return false;
    }
    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrMsg("");
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/invite/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          login_code: loginCode.trim(),
        }),
      });

     const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal login.");
      }

      // Reset data lama jika login baru dilakukan manual
      localStorage.removeItem("pesertaData");

      localStorage.setItem(
        "loginPeserta",
        JSON.stringify({
          email: data.email,
          examId: data.examId,
          loginAt: new Date().toISOString(),
        })
      );

      navigate("/peserta");
    } catch (err) {
      console.error(err);
      setErrMsg(err.message || "Terjadi kesalahan saat login.");
      setLoading(false);
    }
  };

  const bgStyle = bgUrl ? { backgroundImage: `url(${bgUrl})` } : {};
  const bgClass = bgUrl ? "bg-cover bg-center" : defaultBgPeserta;

  if (bgLoading) {
    return (
      <div
        className={`flex-1 ${defaultBgPeserta} flex items-center justify-center`}
      >
        <FaSpinner className="animate-spin text-4xl text-blue-600" />
      </div>
    );
  }

  return (
    <div
      className={`flex-1 flex items-center justify-center px-4 ${bgClass}`}
      style={bgStyle}
    >
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl border border-gray-200 p-7">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Login Peserta</h1>
        <p className="text-sm text-gray-500 mb-6">
          Masukkan Email dan Kode Login yang Anda terima dari admin.
        </p>

        {errMsg && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
            {errMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <FaEnvelope />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                placeholder="Masukan Email Terdaftar"
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Kode Login */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kode Login
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <FaKey />
              </span>
              <input
                type="text"
                value={loginCode}
                onChange={(e) => setLoginCode(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                placeholder="Masukan Kode Login (misal: XJ4P1L)"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Kode login unik yang Anda terima di email.
            </p>
          </div>

          {/* Tombol Login */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-white font-semibold shadow
             ${
               loading
                 ? "bg-gray-400 cursor-not-allowed"
                 : "bg-blue-600 hover:bg-blue-700"
             }`}
          >
            {loading ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaSignInAlt />
            )}
            {loading ? "Memverifikasi..." : "Login"}
          </button>
        </form>

        <div className="mt-6 text-xs text-gray-500">
          Lupa Kode Login? Hubungi admin untuk mengirim ulang undangan.
        </div>
      </div>
    </div>
  );
};

export default LoginPeserta;