// File: src/admin/TambahAdmin.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  FaUserPlus,
  FaUser,
  FaEnvelope,
  FaKey,
  FaSpinner,
  FaEye,
  FaEyeSlash,
  FaShieldAlt,
  FaUserShield,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimes,
} from "react-icons/fa";
import { jwtDecode } from "jwt-decode";
import DaftarAdmin from "./DaftarAdmin"; 

const API_URL = "https://kompeta.web.bps.go.id";

/** Komponen notifikasi di Parent (untuk form) */
const MemoizedMessage = ({ type, text, onDismiss }) => {
  if (!text) return null;
  const isSuccess = type === "success";
  const bgColor = isSuccess ? "bg-green-50" : "bg-red-50";
  const textColor = isSuccess ? "text-green-700" : "text-red-700";
  const borderColor = isSuccess ? "border-green-200" : "border-red-200";
  const Icon = isSuccess ? FaCheckCircle : FaExclamationTriangle;

  return (
    <div className={`flex items-start p-3 mb-4 text-sm border rounded-xl ${bgColor} ${textColor} ${borderColor}`}>
      <Icon className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
      <div className="flex-1"><span className="font-medium">{text}</span></div>
      <button type="button" className={`ml-3 ${textColor} rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8 hover:bg-black/5`} onClick={onDismiss}>
        <FaTimes />
      </button>
    </div>
  );
};

// --- Helper Functions ---
const strengthLabel = (s) => {
  switch (s) {
    case 0: case 1: return "Sangat lemah";
    case 2: return "Lemah";
    case 3: return "Cukup";
    case 4: return "Kuat";
    default: return "-";
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

const getCurrentAdmin = () => {
  try {
    const stored = JSON.parse(sessionStorage.getItem("adminData") || "{}");
    if (stored && (stored.role || stored.id)) return stored;
    const token = sessionStorage.getItem("adminToken");
    if (token) {
      const dec = jwtDecode(token);
      return { id: dec.id, username: dec.username, role: dec.role };
    }
  } catch {}
  return {};
};

const TambahAdmin = () => {
  // Form state
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("admin");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  
  // -- NEW: State untuk Modal Tambah Admin --
  const [showAddModal, setShowAddModal] = useState(false);

  // Data List (Parent holds the data)
  const [adminList, setAdminList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAdmin] = useState(getCurrentAdmin());

  const dismissMessage = useCallback(() => setMsg({ type: "", text: "" }), []);

  useEffect(() => {
    if (msg.text) {
      const t = setTimeout(dismissMessage, 4500);
      return () => clearTimeout(t);
    }
  }, [msg, dismissMessage]);

  // Fetch data admin
  const fetchAdmins = useCallback(async () => {
    setIsLoading(true);
    const token = sessionStorage.getItem("adminToken");
    try {
      const res = await fetch(`${API_URL}/api/admin/invite-history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setAdminList(data);
      }
    } catch (e) {
      console.error("Gagal memuat riwayat admin:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  // Validasi & Submit Form
  const emailError = email && !/\S+@\S+\.\S+/.test(email) ? "Format email tidak valid." : "";
  const pwMatchError = confirmPassword && password !== confirmPassword ? "Konfirmasi tidak sama." : "";
  const pwLenError = password && password.length < 6 ? "Minimal 6 karakter." : "";
  const formIncomplete = !username.trim() || !email.trim() || !password || !confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    dismissMessage();

    if (formIncomplete) return setMsg({ type: "error", text: "Semua field wajib diisi." });
    if (emailError) return setMsg({ type: "error", text: emailError });
    if (pwLenError) return setMsg({ type: "error", text: pwLenError });
    if (pwMatchError) return setMsg({ type: "error", text: "Password tidak cocok." });

    setIsSaving(true);
    const token = sessionStorage.getItem("adminToken");

    try {
      const res = await fetch(`${API_URL}/api/admin/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menambah admin.");

      // Sukses
      setMsg({ type: "success", text: "Admin baru berhasil ditambahkan!" });
      handleResetForm();
      
      // Refresh list & Tutup Modal (opsional: beri sedikit delay agar notif sukses terbaca)
      await fetchAdmins();
      setTimeout(() => setShowAddModal(false), 1500); 

    } catch (err) {
      setMsg({ type: "error", text: err.message || "Terjadi kesalahan." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetForm = () => {
    setUsername(""); setEmail(""); setPassword(""); setConfirmPassword("");
    setRole("admin"); setShowPw(false); setShowPw2(false);
    setMsg({ type: "", text: "" }); // Reset pesan juga saat form direset
  };

  const closeModal = () => {
    setShowAddModal(false);
    handleResetForm();
  }

  const pwStrength = calcStrength(password);

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      
      {/* Page Header / Navbar */}
      <div className="bg-white shadow-sm border-b border-gray-300 py-4 pl-14 pr-4 md:px-8 md:py-5 sticky top-0 z-50 flex items-center gap-3 transition-all">
        {/* Icon: Hidden di mobile */}
        <div className="hidden md:flex w-10 h-10 rounded-xl bg-indigo-600 text-white items-center justify-center shadow-sm">
          <FaShieldAlt />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Manajemen Admin</h1>
          {/* Deskripsi: Hidden di mobile */}
          <p className="hidden md:block text-sm text-gray-600 mt-1">Kelola akun admin dan hak akses sistem.</p>
        </div>
      </div>

      <div className="p-4 md:p-6 lg:p-8">
        
        {/* Tampilkan pesan sukses global jika modal tertutup */}
        {!showAddModal && msg.type === 'success' && (
             <div className="max-w-4xl mx-auto mb-4">
                 <MemoizedMessage {...msg} onDismiss={dismissMessage} />
             </div>
        )}

        {/* ================= MAIN CONTENT: DAFTAR ADMIN ================= */}
        <div className="max-w-[1600px] mx-auto">
             <DaftarAdmin 
                adminList={adminList} 
                isLoading={isLoading} 
                onRefresh={fetchAdmins} 
                currentUser={currentAdmin}
                onAddClick={() => setShowAddModal(true)} // Trigger Modal
             />
        </div>

      </div>

      {/* ================= MODAL TAMBAH ADMIN ================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
           {/* Modal Overlay Click to Close */}
           <div className="absolute inset-0" onClick={closeModal}></div>

           {/* Modal Content */}
           <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              
              {/* Modal Header */}
              <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                        <FaUserPlus />
                    </div>
                    <h2 className="text-lg font-bold text-gray-800">Tambah Admin Baru</h2>
                 </div>
                 <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-200 transition">
                    <FaTimes size={18} />
                 </button>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="p-6 overflow-y-auto">
                 <MemoizedMessage {...msg} onDismiss={dismissMessage} />

                 <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* Username */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><FaUser /></span>
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition" placeholder="Username unik" />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><FaEnvelope /></span>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`block w-full pl-10 pr-3 py-2.5 border rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition ${emailError ? "border-red-300" : "border-gray-300"}`} placeholder="admin@contoh.com" />
                      </div>
                      {emailError && <p className="mt-1 text-xs text-red-600">{emailError}</p>}
                    </div>

                    {/* Role */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><FaUserShield /></span>
                        <select value={role} onChange={(e) => setRole(e.target.value)} className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition cursor-pointer">
                          <option value="admin">Admin (Biasa)</option>
                          <option value="superadmin">Super Admin</option>
                        </select>
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><FaKey /></span>
                        <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className={`block w-full pl-10 pr-10 py-2.5 border rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition ${pwLenError ? "border-red-300" : "border-gray-300"}`} placeholder="Minimal 6 karakter" />
                        <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-indigo-600 transition">{showPw ? <FaEyeSlash /> : <FaEye />}</button>
                      </div>
                      {pwLenError && <p className="mt-1 text-xs text-red-600">{pwLenError}</p>}
                      {/* Strength Meter */}
                      <div className="mt-2 flex gap-1">
                        {[0, 1, 2, 3].map((i) => <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${pwStrength > i ? "bg-indigo-500" : "bg-gray-200"}`} />)}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Kekuatan: {strengthLabel(pwStrength)}</p>
                    </div>

                    {/* Konfirmasi Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><FaKey /></span>
                        <input type={showPw2 ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`block w-full pl-10 pr-10 py-2.5 border rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition ${pwMatchError ? "border-red-300" : "border-gray-300"}`} placeholder="Ulangi password" />
                        <button type="button" onClick={() => setShowPw2(!showPw2)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-indigo-600 transition">{showPw2 ? <FaEyeSlash /> : <FaEye />}</button>
                      </div>
                      {pwMatchError && <p className="mt-1 text-xs text-red-600">{pwMatchError}</p>}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-100 mt-6">
                       <button type="button" onClick={closeModal} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition">
                          Batal
                       </button>
                       <button type="submit" disabled={isSaving || formIncomplete || emailError || pwLenError || pwMatchError} className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 shadow-md hover:shadow-lg">
                          {isSaving ? <FaSpinner className="animate-spin" /> : <FaUserPlus />} {isSaving ? "Menyimpan..." : "Simpan Admin"}
                       </button>
                    </div>

                 </form>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default TambahAdmin;