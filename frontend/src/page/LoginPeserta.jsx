import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FaEnvelope, 
  FaKey, 
  FaSignInAlt, 
  FaSpinner, 
  FaTimes, 
  FaCalendarTimes, 
  FaClock 
} from "react-icons/fa";

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

  // State untuk Modal & Data Ujian Berakhir
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [expiredDetails, setExpiredDetails] = useState(null);

  // Helper: Format Tanggal Indonesia
  const formatIndoDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch (e) {
      return dateStr;
    }
  };

  // --- LOGIKA AUTO-REDIRECT ---
  useEffect(() => {
    const checkSession = async () => {
      const loginDataStr = localStorage.getItem("loginPeserta");
      const pesertaDataStr = localStorage.getItem("pesertaData");

      if (loginDataStr) {
        try {
          const loginData = JSON.parse(loginDataStr);

          if (loginData && loginData.examId) {
            
            // --- VALIDASI WAKTU (Auto-Check saat refresh) ---
            try {
               const resCheck = await fetch(`${API_URL}/api/ujian/public/${loginData.examId}`);
               if (resCheck.ok) {
                 const jsonCheck = await resCheck.json();
                 const exam = jsonCheck.data || jsonCheck;
                 
                 if (exam) {
                    const strTanggal = exam.tanggal_berakhir || exam.tanggal; 
                    const strJam = exam.jam_berakhir;

                    const examEndString = `${strTanggal}T${strJam}`;
                    const examEndTime = new Date(examEndString).getTime();
                    const now = new Date().getTime();
                    
                    if (now > examEndTime) {
                       // Jika expired saat user me-refresh halaman login
                       setExpiredDetails({
                         nama: exam.keterangan,
                         tgl: strTanggal,
                         jam: strJam
                       });

                       localStorage.clear();
                       setShowExpiredModal(true);
                       return; 
                    }
                 }
               }
            } catch (errCheck) {
               console.error("Auto-check failed:", errCheck);
            }
            // ------------------------------------------------

            if (pesertaDataStr) {
              console.log("Sesi ditemukan, mengarahkan kembali ke ujian...");
              navigate(`/ujian/${loginData.examId}`, { replace: true });
            } else {
              console.log("Sesi login ditemukan, mengarahkan ke pengisian data...");
              navigate("/peserta", { replace: true });
            }
          }
        } catch (e) {
          console.error("Data storage korup, mereset sesi.", e);
          localStorage.clear();
        }
      }
    };
    
    checkSession();
  }, [navigate]);
  // --- SELESAI LOGIKA AUTO-REDIRECT ---

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

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrMsg("");
    setShowExpiredModal(false);

    if (!email.trim() || !loginCode.trim()) {
        setErrMsg("Email dan Kode Login wajib diisi.");
        return;
    }

    setLoading(true);

    try {
      // 1. REQUEST LOGIN KE API
      const res = await fetch(`${API_URL}/api/invite/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          login_code: loginCode.trim(),
        }),
      });

      const data = await res.json();

      // 2. TANGKAP ERROR DARI BACKEND
      if (!res.ok) {
         // Cek apakah error karena Waktu Habis (Code: EXAM_EXPIRED)
         if (data.code === 'EXAM_EXPIRED' && data.data) {
             setExpiredDetails({
                nama: data.data.keterangan,
                tgl: data.data.tanggal_berakhir,
                jam: data.data.jam_berakhir
             });
             setLoading(false);
             setShowExpiredModal(true);
             localStorage.clear(); // Hapus sisa data jika ada
             return; 
         }
         
         // Error lain (salah password, kuota habis, dll)
         throw new Error(data.message || "Gagal login.");
      }

      // 3. JIKA SUKSES (Waktu aman & Login valid)
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
      <div className={`flex-1 ${defaultBgPeserta} flex items-center justify-center`}>
        <FaSpinner className="animate-spin text-4xl text-blue-600" />
      </div>
    );
  }

  return (
    <div className={`flex-1 flex items-center justify-center px-4 ${bgClass}`} style={bgStyle}>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kode Login</label>
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

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-white font-semibold shadow ${
               loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
             }`}
          >
            {loading ? <FaSpinner className="animate-spin" /> : <FaSignInAlt />}
            {loading ? "Memverifikasi..." : "Login"}
          </button>
        </form>

        <div className="mt-6 text-xs text-gray-500">
          Lupa Kode Login? Hubungi admin untuk mengirim ulang undangan.
        </div>
      </div>

      {/* --- POPUP UJIAN BERAKHIR --- */}
      {showExpiredModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform scale-100 animate-fade-in-up">
              
              {/* Header Merah */}
              <div className="bg-red-50 p-6 flex flex-col items-center justify-center border-b border-red-100">
                  <div className="h-16 w-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3 ring-4 ring-red-50">
                      <FaCalendarTimes className="text-3xl" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 text-center">
                      Ujian Telah Berakhir
                  </h3>
              </div>

              {/* Body Content */}
              <div className="p-6">
                <p className="text-gray-600 text-sm text-center mb-6 leading-relaxed">
                  Mohon maaf, sesi ujian ini telah ditutup karena waktu pengerjaan sudah habis.
                </p>
                
                {/* Detail Box */}
                {expiredDetails && (
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
                    <div>
                      <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Nama Ujian</span>
                      <p className="text-gray-900 font-medium text-sm mt-0.5 line-clamp-2">
                        {expiredDetails.nama || "-"}
                      </p>
                    </div>
                    <div className="flex items-start gap-3 pt-2 border-t border-gray-200">
                       <FaClock className="text-gray-400 mt-0.5 shrink-0" />
                       <div>
                          <span className="text-xs text-gray-500 block">Waktu Selesai</span>
                          <span className="text-sm font-semibold text-red-600 block">
                             {formatIndoDate(expiredDetails.tgl)} • {expiredDetails.jam} WIB
                          </span>
                       </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Button */}
              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <button
                    onClick={() => {
                      setShowExpiredModal(false);
                      setLoginCode(""); 
                      localStorage.clear();
                    }}
                    className="w-full inline-flex justify-center items-center gap-2 rounded-xl border border-transparent shadow-sm px-4 py-3 bg-gray-900 text-sm font-bold text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all"
                >
                    <FaTimes /> Tutup Pemberitahuan
                </button>
              </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default LoginPeserta;