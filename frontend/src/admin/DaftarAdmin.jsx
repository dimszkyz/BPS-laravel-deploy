// File: src/admin/DaftarAdmin.jsx
import React, { useState, useMemo, useEffect } from "react";
import {
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaSave,
  FaSpinner,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimes,
  FaPlus,
  FaEdit,
  FaBan,
  FaPowerOff,
  FaUser,
  FaCalendarAlt,
  FaUserShield,
} from "react-icons/fa";

const API_URL = "https://kompeta.web.bps.go.id";

// --- UI COMPONENTS ---
const RoleBadge = ({ role }) => {
  const isSuper = role === "superadmin";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wide border ${
        isSuper
          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
          : "bg-emerald-50 text-emerald-700 border-emerald-200"
      }`}
    >
      {role || "admin"}
    </span>
  );
};

const StatusBadge = ({ isActive }) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] md:text-xs font-medium border ${
        isActive
          ? "bg-green-50 text-green-700 border-green-200"
          : "bg-red-50 text-red-700 border-red-200"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-red-500"}`}></span>
      {isActive ? "Aktif" : "Nonaktif"}
    </span>
  );
};

const formatTanggal = (iso) => {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

const MemoizedMessage = ({ type, text, onDismiss }) => {
  if (!text) return null;
  const isSuccess = type === "success";
  return (
    <div
      className={`flex items-start p-4 mb-6 text-sm border rounded-xl shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 ${
        isSuccess
          ? "bg-green-50 text-green-800 border-green-200"
          : "bg-red-50 text-red-800 border-red-200"
      }`}
    >
      <div className="mt-0.5 mr-3 flex-shrink-0">
        {isSuccess ? <FaCheckCircle /> : <FaExclamationTriangle />}
      </div>
      <div className="flex-1 font-medium leading-relaxed">{text}</div>
      <button
        onClick={onDismiss}
        className="ml-3 p-1 rounded-lg hover:bg-black/5 transition-colors"
      >
        <FaTimes />
      </button>
    </div>
  );
};

// --- MAIN COMPONENT ---

const DaftarAdmin = ({ adminList, isLoading, onRefresh, currentUser, onAddClick }) => {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [roleDrafts, setRoleDrafts] = useState({});
  const [roleSaving, setRoleSaving] = useState({});
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusTarget, setStatusTarget] = useState(null);
  const [isProcessingStatus, setIsProcessingStatus] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [tempUsername, setTempUsername] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  const isSuperadmin = (currentUser.role || "").toLowerCase() === "superadmin";
  const currentAdminId = currentUser.id;

  // Init Role Drafts
  useEffect(() => {
    if (adminList && adminList.length > 0) {
      const drafts = {};
      adminList.forEach((a) => {
        drafts[a.id] = (a.role || "admin").toLowerCase();
      });
      setRoleDrafts(drafts);
    }
  }, [adminList]);

  // Reset Page on Filter Change
  useEffect(() => {
    setPage(1);
  }, [query, sortBy, sortDir]);

  useEffect(() => {
    if (msg.text) {
      const t = setTimeout(() => setMsg({ type: "", text: "" }), 4500);
      return () => clearTimeout(t);
    }
  }, [msg]);

  // --- DATA PROCESSING ---
  const processed = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = adminList || [];
    if (q) {
      list = list.filter((a) =>
        `${a.username} ${a.email} ${a.role} ${a.invited_by}`
          .toLowerCase()
          .includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const va =
        sortBy === "created_at"
          ? new Date(a[sortBy] || 0).getTime()
          : (a[sortBy] || "").toString().toLowerCase();
      const vb =
        sortBy === "created_at"
          ? new Date(b[sortBy] || 0).getTime()
          : (b[sortBy] || "").toString().toLowerCase();
      return va < vb ? -1 * dir : va > vb ? 1 * dir : 0;
    });
    return list;
  }, [adminList, query, sortBy, sortDir]);

  const total = processed.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageSafe = Math.min(Math.max(1, page), totalPages);
  const startIdx = (pageSafe - 1) * pageSize;
  const pageRows = processed.slice(startIdx, startIdx + pageSize);

  // --- HANDLERS ---
  const toggleSort = (key) => {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  const startEditing = (admin) => {
    setEditingId(admin.id);
    setTempUsername(admin.username);
  };
  const cancelEditing = () => {
    setEditingId(null);
    setTempUsername("");
  };

  const saveUsername = async (id) => {
    if (!tempUsername.trim()) return;
    setIsRenaming(true);
    const token = sessionStorage.getItem("adminToken");
    try {
      const res = await fetch(`${API_URL}/api/admin/update-username/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username: tempUsername }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMsg({
        type: "success",
        text: `Username berhasil diubah menjadi "${data.username}"`,
      });
      setEditingId(null);
      onRefresh();
    } catch (error) {
      setMsg({ type: "error", text: error.message });
    } finally {
      setIsRenaming(false);
    }
  };

  const saveRole = async (adminRow) => {
    if (!isSuperadmin) return;
    const targetId = adminRow.id;
    const newRole = (roleDrafts[targetId] || adminRow.role).toLowerCase();
    const oldRole = (adminRow.role || "admin").toLowerCase();
    if (newRole === oldRole) return;

    setRoleSaving((p) => ({ ...p, [targetId]: true }));
    const token = sessionStorage.getItem("adminToken");
    try {
      const res = await fetch(`${API_URL}/api/admin/update-role/${targetId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMsg({ type: "success", text: `Hak akses ${adminRow.username} berhasil diperbarui.` });
      onRefresh();
    } catch (err) {
      setRoleDrafts((p) => ({ ...p, [targetId]: oldRole }));
      setMsg({ type: "error", text: err.message });
    } finally {
      setRoleSaving((p) => ({ ...p, [targetId]: false }));
    }
  };

  const openStatusModal = (adminRow) => {
    if (!isSuperadmin) return;
    setStatusTarget(adminRow);
    setShowStatusModal(true);
  };

  const confirmToggleStatus = async () => {
    if (!statusTarget) return;
    setIsProcessingStatus(true);
    const token = sessionStorage.getItem("adminToken");
    try {
      const res = await fetch(
        `${API_URL}/api/admin/toggle-status/${statusTarget.id}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setMsg({ type: "success", text: data.message });
      onRefresh();
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setIsProcessingStatus(false);
      setShowStatusModal(false);
      setStatusTarget(null);
    }
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
        
        {/* === TOOLBAR === */}
        <div className="p-4 md:p-5 border-b border-gray-100 bg-gray-50/50">
          <MemoizedMessage {...msg} onDismiss={() => setMsg({ type: "", text: "" })} />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full sm:max-w-xs group">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari admin..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
              />
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
              <div className="text-xs text-gray-500 hidden sm:block">
                Total: <span className="font-semibold text-gray-900">{total}</span>
              </div>
              <button
                onClick={onAddClick}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-sm hover:shadow-md"
              >
                <FaPlus className="text-xs" />
                <span>Tambah Admin</span>
              </button>
            </div>
          </div>
        </div>

        {/* === CONTENT AREA === */}
        <div className="flex-1 bg-gray-50 md:bg-white p-4 md:p-0">
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 animate-pulse">
              <FaSpinner className="animate-spin text-3xl mb-3 text-indigo-400" />
              <span className="text-sm">Memuat data...</span>
            </div>
          ) : pageRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                <FaSearch className="text-2xl" />
              </div>
              <h3 className="text-gray-900 font-medium text-lg">Data tidak ditemukan</h3>
              <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
                Coba ubah kata kunci pencarian Anda.
              </p>
            </div>
          ) : (
            <>
              {/* --- VIEW 1: DESKTOP TABLE --- */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                    <tr>
                      <th className="p-4 w-[25%] cursor-pointer hover:bg-gray-100 transition" onClick={() => toggleSort("username")}>
                        <div className="flex items-center gap-1">Username {sortBy === "username" && (sortDir === "asc" ? <FaSortUp/> : <FaSortDown/>)}</div>
                      </th>
                      <th className="p-4 w-[25%] cursor-pointer hover:bg-gray-100 transition" onClick={() => toggleSort("email")}>
                        <div className="flex items-center gap-1">Email {sortBy === "email" && (sortDir === "asc" ? <FaSortUp/> : <FaSortDown/>)}</div>
                      </th>
                      <th className="p-4 text-center w-[10%]">Status</th>
                      <th className="p-4 w-[15%]">Role</th>
                      {isSuperadmin && <th className="p-4 text-center w-[10%]">Aksi</th>}
                      <th className="p-4 w-[15%] text-gray-400 font-normal">Info</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pageRows.map((a) => {
                      const isActive = a.is_active !== undefined ? (a.is_active === 1 || a.is_active === true) : true;
                      const isSelf = a.id === currentAdminId;
                      const isEditingThis = editingId === a.id;
                      const rowRole = (a.role || "admin").toLowerCase();
                      const draftRole = (roleDrafts[a.id] || rowRole).toLowerCase();
                      
                      // --- LOGIC PERLINDUNGAN SUPER ADMIN (HIERARKI) ---
                      const isActorRoot = currentAdminId === 1; // Apakah saya Super Admin Utama?
                      const isTargetRoot = a.id === 1;          // Apakah target Super Admin Utama?
                      const isTargetSuper = rowRole === "superadmin";

                      // Tentukan apakah row ini "Protected" (tidak bisa diedit oleh user yang sedang login)
                      let isProtected = false;

                      // Aturan 1: Target Root tidak bisa diapa-apakan oleh siapapun (termasuk dirinya, utk role/status)
                      if (isTargetRoot) {
                          isProtected = true;
                      } 
                      // Aturan 2: Target Super Admin (bukan root) hanya bisa diubah oleh Root
                      else if (isTargetSuper) {
                          if (!isActorRoot) {
                              isProtected = true;
                          }
                      }

                      return (
                        <tr key={a.id} className={`group hover:bg-gray-50 transition-colors ${!isActive ? "bg-red-50/30" : ""}`}>
                          {/* Username Cell */}
                          <td className="p-4 align-middle">
                            {isEditingThis ? (
                              <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                                <input
                                  autoFocus
                                  type="text"
                                  value={tempUsername}
                                  onChange={(e) => setTempUsername(e.target.value)}
                                  className="w-full px-2 py-1.5 text-sm border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                />
                                <button onClick={() => saveUsername(a.id)} disabled={isRenaming} className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200 transition">
                                  {isRenaming ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                                </button>
                                <button onClick={cancelEditing} disabled={isRenaming} className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition">
                                  <FaTimes />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between group/edit">
                                <div className="flex items-center gap-3">
                                  <div className="flex flex-col">
                                    <span className={`font-semibold text-gray-900 ${!isActive && "line-through text-gray-400"}`}>
                                      {a.username}
                                    </span>
                                    {isSelf && <span className="text-[10px] text-indigo-600 font-medium">Anda</span>}
                                    {/* Label untuk Root */}
                                    {a.id === 1 && <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 rounded w-fit border border-amber-200">UTAMA</span>}
                                  </div>
                                </div>
                                {isSuperadmin && (
                                  <button 
                                    onClick={() => startEditing(a)} 
                                    className="text-gray-400 hover:text-indigo-600 transition-colors p-1 ml-2"
                                    title="Ubah Username"
                                  >
                                    <FaEdit />
                                  </button>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Email Cell */}
                          <td className="p-4 align-middle text-gray-600">{a.email}</td>

                          {/* Status Cell */}
                          <td className="p-4 align-middle text-center">
                            <StatusBadge isActive={isActive} />
                          </td>

                          {/* Role Cell */}
                          <td className="p-4 align-middle">
                            {isSuperadmin ? (
                              <div className="relative">
                                <select
                                  value={draftRole}
                                  onChange={(e) => setRoleDrafts((p) => ({ ...p, [a.id]: e.target.value }))}
                                  // Disable jika protected atau self (biasanya role diri sendiri tidak diubah di sini)
                                  disabled={roleSaving[a.id] || isSelf || !isActive || isProtected}
                                  className={`w-full appearance-none pl-3 pr-8 py-1.5 text-xs font-medium border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition cursor-pointer capitalize
                                    ${roleSaving[a.id] || isSelf || !isActive || isProtected
                                        ? "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed" 
                                        : "border-gray-300 text-gray-700 hover:border-indigo-400"}
                                  `}
                                >
                                  <option value="admin">Admin</option>
                                  <option value="superadmin">Superadmin</option>
                                </select>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
                                  ▼
                                </div>
                              </div>
                            ) : (
                              <RoleBadge role={rowRole} />
                            )}
                          </td>

                          {/* Action Cell */}
                          {isSuperadmin && (
                            <td className="p-4 align-middle text-center">
                              <div className="flex items-center justify-center gap-2">
                                {/* Tombol Simpan Role */}
                                <button
                                  onClick={() => saveRole(a)}
                                  disabled={roleSaving[a.id] || isSelf || draftRole === rowRole || !isActive || isProtected}
                                  className={`p-1.5 rounded-lg transition-all ${
                                    roleSaving[a.id] || isSelf || draftRole === rowRole || !isActive || isProtected
                                      ? "text-gray-300 cursor-not-allowed"
                                      : "text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                                  }`}
                                  title="Simpan Perubahan Role"
                                >
                                  {roleSaving[a.id] ? <FaSpinner className="animate-spin" /> : <FaSave />}
                                </button>

                                {/* Tombol Toggle Status */}
                                <button
                                  onClick={() => openStatusModal(a)}
                                  disabled={isSelf || isProtected}
                                  className={`p-1.5 rounded-lg transition-all ${
                                    isSelf || isProtected
                                      ? "text-gray-300 cursor-not-allowed"
                                      : isActive
                                      ? "text-red-600 bg-red-50 hover:bg-red-100"
                                      : "text-green-600 bg-green-50 hover:bg-green-100"
                                  }`}
                                  title={isActive ? "Nonaktifkan" : "Aktifkan"}
                                >
                                  {isActive ? <FaBan /> : <FaPowerOff />}
                                </button>
                              </div>
                            </td>
                          )}

                          <td className="p-4 align-middle">
                            <div className="flex flex-col gap-0.5 text-xs text-gray-500">
                              <span className="flex items-center gap-1"><FaUserShield className="text-[10px]"/> {a.invited_by || "-"}</span>
                              <span className="flex items-center gap-1"><FaCalendarAlt className="text-[10px]"/> {formatTanggal(a.created_at)}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* --- VIEW 2: MOBILE CARDS --- */}
              <div className="md:hidden space-y-4">
                {pageRows.map((a) => {
                  const isActive = a.is_active !== undefined ? a.is_active === 1 : true;
                  const isSelf = a.id === currentAdminId;
                  const isEditingThis = editingId === a.id;
                  const rowRole = (a.role || "admin").toLowerCase();
                  const draftRole = (roleDrafts[a.id] || rowRole).toLowerCase();
                  
                  // --- LOGIC PERLINDUNGAN (MOBILE) ---
                  const isActorRoot = currentAdminId === 1;
                  const isTargetRoot = a.id === 1;
                  const isTargetSuper = rowRole === "superadmin";

                  let isProtected = false;
                  if (isTargetRoot) {
                      isProtected = true;
                  } else if (isTargetSuper) {
                      if (!isActorRoot) {
                          isProtected = true;
                      }
                  }

                  return (
                    <div key={a.id} className={`bg-white p-4 rounded-xl border shadow-sm ${!isActive ? 'border-red-100 bg-red-50/10' : 'border-gray-200'}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              {isEditingThis ? (
                                <div className="flex items-center gap-1">
                                  <input 
                                    className="w-24 text-sm border rounded px-1" 
                                    value={tempUsername} 
                                    onChange={e=>setTempUsername(e.target.value)} 
                                  />
                                  <button onClick={() => saveUsername(a.id)} className="text-green-600"><FaCheckCircle/></button>
                                  <button onClick={cancelEditing} className="text-red-500"><FaTimes/></button>
                                </div>
                              ) : (
                                <h3 className={`font-bold text-gray-900 ${!isActive && 'line-through text-gray-500'}`}>
                                  {a.username}
                                </h3>
                              )}
                              {isSelf && <span className="text-[10px] bg-gray-100 px-1.5 rounded text-gray-600">Anda</span>}
                              {a.id === 1 && <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 rounded border border-amber-200">UTAMA</span>}
                            </div>
                            <div className="text-xs text-gray-500 break-all">{a.email}</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                           <StatusBadge isActive={isActive} />
                           {!isEditingThis && isSuperadmin && (
                             <button onClick={() => startEditing(a)} className="text-xs text-indigo-600 underline mt-1">Ubah Nama</button>
                           )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 mb-3">
                        <div>
                          <span className="block text-gray-400 mb-0.5">Dibuat Oleh</span>
                          <span className="font-medium flex items-center gap-1"><FaUser className="text-[10px]"/> {a.invited_by || "-"}</span>
                        </div>
                        <div>
                          <span className="block text-gray-400 mb-0.5">Bergabung</span>
                          <span className="font-medium flex items-center gap-1"><FaCalendarAlt className="text-[10px]"/> {formatTanggal(a.created_at)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
                        <div className="flex-1">
                           {isSuperadmin ? (
                             <div className="flex items-center gap-2">
                                <select
                                  value={draftRole}
                                  onChange={(e) => setRoleDrafts((p) => ({ ...p, [a.id]: e.target.value }))}
                                  disabled={roleSaving[a.id] || isSelf || !isActive || isProtected}
                                  className="w-full text-xs border-gray-300 rounded-lg py-1.5 px-2 bg-white border"
                                >
                                  <option value="admin">Admin</option>
                                  <option value="superadmin">Superadmin</option>
                                </select>
                                <button 
                                  onClick={() => saveRole(a)}
                                  disabled={roleSaving[a.id] || isSelf || draftRole === rowRole || !isActive || isProtected}
                                  className={`p-2 rounded-lg bg-indigo-50 text-indigo-600 ${roleSaving[a.id] || isSelf || draftRole === rowRole || !isActive || isProtected ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-100'}`}
                                >
                                  {roleSaving[a.id] ? <FaSpinner className="animate-spin"/> : <FaSave/>}
                                </button>
                             </div>
                           ) : (
                             <RoleBadge role={rowRole} />
                           )}
                        </div>

                        {isSuperadmin && (
                          <button
                            onClick={() => openStatusModal(a)}
                            disabled={isSelf || isProtected}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                              isActive 
                                ? "bg-white text-red-600 border-red-200 hover:bg-red-50" 
                                : "bg-white text-green-600 border-green-200 hover:bg-green-50"
                            } ${isSelf || isProtected ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {isActive ? <><FaBan/> Nonaktifkan</> : <><FaPowerOff/> Aktifkan</>}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* --- PAGINATION --- */}
        <div className="p-4 border-t border-gray-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-gray-500 order-2 sm:order-1">
            Menampilkan halaman <span className="font-semibold text-gray-900">{pageSafe}</span> dari {totalPages}
          </div>
          <div className="flex items-center gap-2 order-1 sm:order-2 w-full sm:w-auto">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pageSafe === 1}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Sebelumnya
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={pageSafe === totalPages}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>

      {/* --- MODAL STATUS --- */}
      {showStatusModal && statusTarget && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 overflow-hidden">
            <div className="flex flex-col items-center text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${statusTarget.is_active ? 'bg-red-100 text-red-500' : 'bg-green-100 text-green-500'}`}>
                {statusTarget.is_active ? <FaBan className="text-xl" /> : <FaPowerOff className="text-xl" />}
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {statusTarget.is_active ? "Nonaktifkan Akun?" : "Aktifkan Akun?"}
              </h3>
              
              <p className="text-sm text-gray-500 mb-6">
                {statusTarget.is_active 
                  ? <span>Akun <strong>{statusTarget.username}</strong> tidak akan bisa mengakses sistem. Data tidak akan dihapus.</span>
                  : <span>Akun <strong>{statusTarget.username}</strong> akan dapat login dan menggunakan sistem kembali.</span>
                }
              </p>

              <div className="flex w-full gap-3">
                <button
                  onClick={() => { if (!isProcessingStatus) { setShowStatusModal(false); setStatusTarget(null); } }}
                  disabled={isProcessingStatus}
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  onClick={confirmToggleStatus}
                  disabled={isProcessingStatus}
                  className={`flex-1 px-4 py-2.5 text-white font-semibold rounded-xl shadow-md transition flex justify-center items-center gap-2 ${statusTarget.is_active ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {isProcessingStatus ? <FaSpinner className="animate-spin" /> : "Ya, Lanjutkan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DaftarAdmin;