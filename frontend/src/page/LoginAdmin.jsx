// File: src/page/LoginAdmin.jsx
import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserShield, FaKey, FaSignInAlt, FaEye, FaEyeSlash, FaSpinner } from "react-icons/fa";
import ReCAPTCHA from "react-google-recaptcha";
import { jwtDecode } from "jwt-decode"; // Pastikan import ini ada
import Header from "../component/header";

const API_URL = "https://kompeta.web.bps.go.id";
const SITE_KEY = "6Le6fSosAAAAAH_3uRpgisTOvN_O6rs9vp1evOK7";
const defaultBgAdmin = "bg-gray-50";

const LoginAdmin = () => {
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [captcha, setCaptcha] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const [bgUrl, setBgUrl] = useState("");
  const [bgLoading, setBgLoading] = useState(true);

  useEffect(() => {
    // Bersihkan sesi lama saat halaman login dibuka
    sessionStorage.clear();
    localStorage.clear();

    const fetchBgSetting = async () => {
      try {
        const res = await fetch(`${API_URL}/api/settings?t=${Date.now()}`); // Cache busting
        const data = await res.json();
        if (data.adminBgImage) {
          setBgUrl(`${API_URL}${data.adminBgImage}`);
        }
      } catch (err) {
        console.error("Gagal memuat BG Admin:", err);
      } finally {
        setBgLoading(false);
      }
    };
    fetchBgSetting();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrMsg("");

    if (!username || !password) {
      setErrMsg("Username/Email dan Password wajib diisi.");
      return;
    }
    if (!captcha) {
      setErrMsg("Verifikasi captcha terlebih dahulu.");
      return;
    }

    setLoading(true);
    try {
      // 1. Tambahkan timestamp (?t=...) untuk mencegah browser cache respons lama
      const res = await fetch(`${API_URL}/api/admin/login?t=${Date.now()}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate", // Paksa request baru
          "Pragma": "no-cache",
          "Expires": "0"
        },
        body: JSON.stringify({ email: username, password, captcha }),
      });

      let data = {};
      const text = await res.text();
      
      try {
        if (text) data = JSON.parse(text);
      } catch {
        console.error("Respons invalid:", text);
        throw new Error("Terjadi kesalahan parsing respons server.");
      }

      if (!res.ok) throw new Error(data.message || "Gagal login.");

      // 2. VALIDASI TOKEN: Cek apakah token yang diterima benar-benar BARU
      sessionStorage.clear(); 
      sessionStorage.setItem("adminToken", data.token);
      sessionStorage.setItem("adminData", JSON.stringify(data.admin)); // Pastikan backend mengirim 'admin'
      
      // 4. Beri waktu sedikit lebih lama agar storage tersinkronisasi
      setTimeout(() => {
        navigate("/admin/dashboard", { replace: true });
      }, 300);

      // 3. Simpan Token Baru
      sessionStorage.clear(); // Pastikan bersih 100%
      sessionStorage.setItem("adminToken", data.token);
      sessionStorage.setItem("adminData", JSON.stringify(data.admin));
      
      // 4. Beri waktu sedikit lebih lama agar storage tersinkronisasi
      setTimeout(() => {
        navigate("/admin/dashboard", { replace: true });
      }, 300); // Naikkan ke 300ms untuk keamanan
      
    } catch (err) {
      console.error(err);
      setErrMsg(err.message || "Terjadi kesalahan saat login.");
      
      // Reset captcha jika gagal
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
      setCaptcha(null);
      setLoading(false);
    } 
  };

  const bgStyle = bgUrl ? { backgroundImage: `url(${bgUrl})` } : {};
  const bgClass = bgUrl ? "bg-cover bg-center" : defaultBgAdmin;

  if (bgLoading) {
    return (
      <div className={`min-h-screen ${defaultBgAdmin} flex items-center justify-center`}>
        <FaSpinner className="animate-spin text-4xl text-blue-600" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen text-gray-800 flex flex-col ${bgClass}`} style={bgStyle}>
      <Header />
      <div className={`flex-1 flex items-center justify-center px-4`}>
        <div className="w-full max-w-md bg-white shadow-xl rounded-2xl border border-gray-200 p-7">

          <div className="flex items-center gap-3 mb-2">
            <FaUserShield className="text-2xl text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">Admin Panel Login</h1>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Halaman ini khusus untuk administrator.
          </p>

          {errMsg && (
            <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-300 rounded-md p-3">
              {errMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* USERNAME */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username atau Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <FaUserShield />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border bg-white border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                  placeholder="Masukan username atau email"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <FaKey />
                </span>
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border bg-white border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                  placeholder="Masukan password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  aria-label={showPwd ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPwd ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* CAPTCHA */}
            <div className="scale-90 origin-left">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={SITE_KEY}
                onChange={(val) => setCaptcha(val)}
              />
            </div>

            {/* TOMBOL LOGIN */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-white font-semibold shadow transition ${loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
                }`}
            >
              {loading ? <FaSpinner className="animate-spin" /> : <FaSignInAlt />}
              {loading ? "Memverifikasi..." : "Login"}
            </button>
          </form>
          <button
            type="button"
            onClick={() => navigate("/admin/lupa-password")}
            className="text-sm text-indigo-600 hover:underline mt-2"
          >
            Lupa password?
          </button>
        </div>
      </div>

      {/* FOOTER */}
      <footer className={`w-full mt-8 border-t border-gray-200 ${bgUrl ? 'bg-white/80' : 'bg-white'} py-3`}>
        <div className="max-w-7xl mx-auto text-center text-[12px] text-gray-500">
          © {new Date().getFullYear()} BPS Kota Salatiga. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LoginAdmin;