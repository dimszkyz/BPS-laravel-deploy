// File: src/admin/PermintaanResetPassword.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  FaUserShield,
  FaSearch,
  FaSyncAlt,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaKey,
  FaEye,
  FaTimes,
  FaWhatsapp,
} from "react-icons/fa";

const API_URL = "https://kompeta.web.bps.go.id";
const GET_REQUESTS_ENDPOINT = "/api/admin/forgot-password/requests";
const RESET_ENDPOINT = "/api/admin/forgot-password/approve";

const Badge = ({ status }) => {
  const s = (status || "").toLowerCase();
  const map = {
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    approved: "bg-green-50 text-green-700 border-green-200", // [UPDATE] Tambahkan approved
    resolved: "bg-green-50 text-green-700 border-green-200", // Legacy support
    rejected: "bg-red-50 text-red-700 border-red-200",
  };
  const label = {
    pending: "Pending",
    approved: "Selesai", // [UPDATE] Label untuk approved
    resolved: "Selesai",
    rejected: "Ditolak",
  };
  return (
    <span
      className={`px-2.5 py-1 text-xs font-semibold border rounded-full ${
        map[s] || "bg-gray-50 text-gray-700 border-gray-200"
      }`}
    >
      {label[s] || s || "-"}
    </span>
  );
};

const Message = ({ type, text, onDismiss }) => {
  if (!text) return null;
  const isSuccess = type === "success";
  const bgColor = isSuccess ? "bg-green-50" : "bg-red-50";
  const textColor = isSuccess ? "text-green-700" : "text-red-700";
  const borderColor = isSuccess ? "border-green-200" : "border-red-200";
  const Icon = isSuccess ? FaCheckCircle : FaExclamationTriangle;

  return (
    <div
      className={`flex items-start p-3 mb-4 text-sm border rounded-xl ${bgColor} ${textColor} ${borderColor}`}
    >
      <Icon className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
      <div className="flex-1 font-medium">{text}</div>
      <button
        type="button"
        onClick={onDismiss}
        className={`ml-3 ${textColor} rounded-lg p-1.5 h-8 w-8 inline-flex items-center justify-center hover:bg-black/5`}
        title="Tutup"
      >
        <FaTimes />
      </button>
    </div>
  );
};

// normalize nomor WA untuk link wa.me
const normalizeWhatsApp = (raw) => {
  if (!raw) return "";
  let n = String(raw).trim().replace(/\s|-/g, "");
  if (n.startsWith("08")) n = "62" + n.slice(1);
  if (n.startsWith("+")) n = n.slice(1);
  return n;
};

// format tanggal saja (tanpa waktu)
const formatTanggalOnly = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("id-ID"); 
};

const PermintaanResetPassword = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState("");

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [expandedId, setExpandedId] = useState(null);
  const [newPw, setNewPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [savingId, setSavingId] = useState(null);

  const [msg, setMsg] = useState({ type: "", text: "" });
  const dismissMessage = useCallback(() => setMsg({ type: "", text: "" }), []);

  const fetchRequests = useCallback(async () => {
    const token = sessionStorage.getItem("adminToken");
    if (!token) {
      setFetchErr("Token tidak ditemukan. Silakan login ulang.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchErr("");
    try {
      const res = await fetch(`${API_URL}${GET_REQUESTS_ENDPOINT}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Gagal memuat permintaan reset.");

      // Pastikan data array
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setFetchErr(e.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      // Logic Filter Status:
      // Jika user pilih 'approved', kita anggap 'resolved' juga sama (legacy)
      const rStatus = (r.status || "").toLowerCase();
      let matchesStatus = true;

      if (filterStatus !== "all") {
        if (filterStatus === "approved") {
            // Tampilkan status 'approved' ATAU 'resolved'
            matchesStatus = rStatus === "approved" || rStatus === "resolved";
        } else {
            matchesStatus = rStatus === filterStatus;
        }
      }
      
      if (!matchesStatus) return false;
      if (!q) return true;

      const hay = `${r.username || ""} ${r.email || ""} ${
        r.whatsapp || r.identifier || ""
      } ${r.reason || ""}`.toLowerCase();

      return hay.includes(q);
    });
  }, [rows, search, filterStatus]);

  const openReset = (rowId) => {
    setExpandedId((prev) => (prev === rowId ? null : rowId));
    setNewPw("");
    setShowPw(false);
    dismissMessage();
  };

  const submitReset = async (row) => {
    dismissMessage();
    const token = sessionStorage.getItem("adminToken");
    if (!token) {
      setMsg({
        type: "error",
        text: "Token tidak ditemukan. Silakan login ulang.",
      });
      return;
    }

    if (!newPw || newPw.length < 6) {
      setMsg({ type: "error", text: "Password baru minimal 6 karakter." });
      return;
    }

    setSavingId(row.id);
    try {
      // POST ke endpoint approve
      const res = await fetch(`${API_URL}${RESET_ENDPOINT}`, {
        method: "POST", 
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
            id: row.id, 
            newPassword: newPw 
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal reset password.");

      setMsg({
        type: "success",
        text: data.message || "Password berhasil direset.",
      });
      setExpandedId(null);
      setNewPw("");
      await fetchRequests(); // Refresh list agar status berubah jadi 'approved'
    } catch (e) {
      setMsg({ type: "error", text: e.message || "Terjadi kesalahan." });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="mt-6 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b bg-gray-50/60 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FaUserShield className="text-indigo-600" />
          <h2 className="text-base font-semibold text-gray-900">
            Permintaan Reset Password Admin
          </h2>
        </div>
        <button
          type="button"
          onClick={fetchRequests}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-white"
          title="Refresh"
        >
          <FaSyncAlt />
          Refresh
        </button>
      </div>

      <div className="p-5">
        <Message {...msg} onDismiss={dismissMessage} />

        {/* Controls */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari username / email / nomor WA / alasan"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="md:w-48 w-full py-2 px-3 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="all">Semua</option>
            <option value="pending">Pending</option>
            <option value="approved">Selesai</option> {/* UPDATE: Value sesuai logika filter */}
          </select>
        </div>

        {/* States */}
        {loading && (
          <div className="flex items-center gap-2 text-gray-600">
            <FaSpinner className="animate-spin" />
            Memuat permintaan reset...
          </div>
        )}

        {!loading && fetchErr && (
          <div className="text-red-600 text-sm">{fetchErr}</div>
        )}

        {!loading && !fetchErr && filteredRows.length === 0 && (
          <div className="text-gray-500 text-sm">
            Tidak ada permintaan reset.
          </div>
        )}

        {/* Table */}
        {!loading && !fetchErr && filteredRows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2 pr-3">Admin</th>
                  <th className="py-2 pr-3">Nomor</th>
                  <th className="py-2 pr-3">Alasan</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Tanggal</th>
                  <th className="py-2 pr-3">Aksi</th>
                </tr>
              </thead>

              <tbody>
                {filteredRows.map((r) => {
                  const isExpanded = expandedId === r.id;
                  const isPending = (r.status || "").toLowerCase() === "pending";

                  const waRaw = r.whatsapp || r.identifier || "";
                  const waLink = waRaw
                    ? `https://wa.me/${normalizeWhatsApp(waRaw)}`
                    : null;

                  return (
                    <React.Fragment key={r.id}>
                      <tr className="border-b last:border-b-0">
                        <td className="py-2 pr-3">
                          <div className="font-semibold text-gray-900">
                            {r.username}
                          </div>
                          <div className="text-xs text-gray-500">{r.email}</div>
                        </td>

                        {/* WhatsApp Column */}
                        <td className="py-2 pr-3 text-gray-700">
                          <div className="flex items-center gap-2">
                            <span>{waRaw || "-"}</span>
                            {waLink && (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center p-1.5 rounded-lg text-green-600 hover:bg-green-50"
                                title="Chat via WhatsApp"
                              >
                                <FaWhatsapp />
                              </a>
                            )}
                          </div>
                        </td>

                        <td className="py-2 pr-3 text-gray-700 align-top">
                          {r.reason ? (
                            <div className="whitespace-pre-wrap break-words max-w-xs md:max-w-sm leading-relaxed">
                              {r.reason}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>

                        <td className="py-2 pr-3">
                          <Badge status={r.status} />
                        </td>

                        <td className="py-2 pr-3 text-gray-700">
                          {formatTanggalOnly(r.requested_at)}
                        </td>

                        <td className="py-2 pr-3">
                          {isPending ? (
                            <button
                              type="button"
                              onClick={() => openReset(r.id)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                            >
                              <FaKey />
                              Reset
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      </tr>

                      {/* Expand reset form */}
                      {isExpanded && (
                        <tr className="border-b bg-gray-50/40">
                          <td colSpan={6} className="py-3">
                            <div className="flex flex-col md:flex-row md:items-center gap-3">
                              <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Password Baru untuk @{r.username}
                                </label>
                                <div className="relative">
                                  <input
                                    type={showPw ? "text" : "password"}
                                    value={newPw}
                                    onChange={(e) => setNewPw(e.target.value)}
                                    className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    placeholder="Minimal 6 karakter"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowPw((v) => !v)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700"
                                    title={showPw ? "Sembunyikan" : "Tampilkan"}
                                  >
                                    <FaEye />
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={savingId === r.id}
                                  onClick={() => submitReset(r)}
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                                >
                                  {savingId === r.id ? (
                                    <FaSpinner className="animate-spin" />
                                  ) : (
                                    <FaCheckCircle />
                                  )}
                                  {savingId === r.id ? "Menyimpan..." : "Simpan"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => openReset(r.id)}
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-white"
                                >
                                  <FaTimes />
                                  Batal
                                </button>
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                              Setelah disimpan, admin bisa login pakai password baru.
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PermintaanResetPassword;