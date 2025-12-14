// File: src/admin/AksesDaftarAdmin/TabUndanganAdmin.jsx

import React, { useState, useEffect, useCallback } from "react";
import {
  FaSyncAlt,
  FaExclamationCircle,
  FaCopy,
  FaCheck,
  FaListUl,
  FaTrashAlt,
  FaSpinner,
  FaExclamationTriangle // Tambahan icon untuk modal
} from "react-icons/fa";

const API_URL = "https://kompeta.web.bps.go.id";

// --- KOMPONEN MODAL KONFIRMASI (Sama seperti di TabUjianAdmin) ---
const KonfirmasiModal = ({ show, message, onCancel, onConfirm }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px]">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm animate-in fade-in zoom-in duration-200">
        <div className="flex items-center gap-3 mb-4">
          <FaExclamationTriangle className="text-yellow-500 text-2xl" />
          <h3 className="text-lg font-semibold text-gray-800">Konfirmasi</h3>
        </div>
        <p className="text-gray-700 mb-6 whitespace-pre-line">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-md bg-red-600 text-white font-semibold hover:bg-red-700 transition"
          >
            Ya, Batalkan
          </button>
        </div>
      </div>
    </div>
  );
};

const TabUndanganAdmin = ({ adminId }) => {
  const [groupedInvitations, setGroupedInvitations] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedCode, setCopiedCode] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // --- State untuk Modal Konfirmasi ---
  const [modalState, setModalState] = useState({
    show: false,
    message: "",
    data: null, // Menyimpan ID dan Email sementara
  });

  // --- Fetch Data ---
  const fetchData = useCallback(async () => {
    if (!adminId) return;
    
    setLoading(true);
    setError("");
    try {
      const token = sessionStorage.getItem("adminToken");
      // Mengambil data dengan filter target_admin_id
      const response = await fetch(`${API_URL}/api/invite/list?target_admin_id=${adminId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        let errorMsg = "Gagal memuat riwayat undangan.";
        try {
          const errData = await response.json();
          errorMsg = errData.message || errorMsg;
        } catch (e) {}
        throw new Error(errorMsg);
      }
      const data = await response.json();

      // Grouping data berdasarkan Exam ID
      const grouped = data.reduce((acc, invite) => {
        const examId = invite.exam_id || "unknown";
        if (!acc[examId]) {
          acc[examId] = {
            keterangan: invite.keterangan_ujian || `Ujian (ID: ${examId})`,
            list: [],
          };
        }
        acc[examId].list.push(invite);
        return acc;
      }, {});

      setGroupedInvitations(grouped);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [adminId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Copy Code Handler ---
  const handleCopy = (loginCode) => {
    navigator.clipboard.writeText(loginCode).then(
      () => {
        setCopiedCode(loginCode);
        setTimeout(() => setCopiedCode(null), 1500);
      },
      (err) => alert("Gagal menyalin kode.")
    );
  };

  // --- MODAL HANDLERS ---
  const openDeleteModal = (invitationId, email) => {
    setModalState({
      show: true,
      message: `Sebagai Super Admin, apakah Anda yakin ingin membatalkan undangan untuk ${email}? \n\nPeserta tidak akan bisa login lagi.`,
      data: { id: invitationId }
    });
  };

  const closeDeleteModal = () => {
    setModalState({ show: false, message: "", data: null });
  };

  // --- EKSEKUSI HAPUS (Dipanggil setelah konfirmasi modal) ---
  const confirmDelete = async () => {
    if (!modalState.data) return;
    const { id } = modalState.data;
    
    // Tutup modal dulu
    closeDeleteModal();
    setDeletingId(id);

    try {
      const token = sessionStorage.getItem("adminToken");
      const response = await fetch(`${API_URL}/api/invite/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Gagal membatalkan undangan.");
      
      // Refresh data setelah hapus
      fetchData();
    } catch (err) {
      alert(`Gagal: ${err.message}`); // Bisa diganti toast jika mau
    } finally {
      setDeletingId(null);
    }
  };

  // --- Date Formatter ---
  const formatTanggal = (isoString) => {
    try {
      return new Date(isoString).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  // --- RENDER ---
  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500">
        <FaSpinner className="animate-spin inline mr-2" /> Memuat riwayat undangan...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-600 bg-red-50 p-4 rounded-lg border border-red-200 flex items-center gap-2 m-6">
        <FaExclamationCircle className="text-lg" /> {error}
      </div>
    );
  }

  if (Object.keys(groupedInvitations).length === 0) {
    return (
      <div className="p-10 text-center text-gray-600 bg-white rounded-xl shadow-md border border-gray-200">
        Admin ini belum mengirim undangan ujian apapun.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Render Modal Konfirmasi */}
      <KonfirmasiModal 
        show={modalState.show}
        message={modalState.message}
        onCancel={closeDeleteModal}
        onConfirm={confirmDelete}
      />

      {Object.entries(groupedInvitations).map(([examId, groupData]) => (
        <div key={examId} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white">
          {/* Group Header */}
          <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex items-center gap-2">
            <FaListUl className="text-blue-600" />
            <h4 className="font-semibold text-blue-800 text-sm md:text-base">
              {groupData.keterangan}
            </h4>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4 w-[25%]">Email Peserta</th>
                  <th className="py-3 px-4 w-[20%]">Nama Ujian</th>
                  <th className="py-3 px-4 w-[15%]">Kode Login</th>
                  <th className="py-3 px-4 w-[10%] text-center">Batas</th>
                  <th className="py-3 px-4 w-[20%]">Waktu Kirim</th>
                  <th className="py-3 px-4 w-[10%] text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {groupData.list.map((invite) => (
                  <tr key={invite.id} className="hover:bg-gray-50 transition-colors">
                    
                    {/* Email */}
                    <td className="py-3 px-4 text-gray-800 font-medium break-all align-middle">
                      {invite.email}
                    </td>

                    {/* Nama Ujian */}
                    <td className="py-3 px-4 text-gray-600 text-xs align-middle">
                      {invite.keterangan_ujian || "-"}
                    </td>

                    {/* Kode Login + Copy */}
                    <td className="py-3 px-4 align-middle">
                      <div className="flex items-center gap-2 bg-gray-100 w-fit px-2 py-1 rounded border border-gray-200">
                        <span className="font-mono text-gray-700 tracking-wide select-all">
                          {invite.login_code}
                        </span>
                        <button
                          onClick={() => handleCopy(invite.login_code)}
                          className={`ml-1 ${copiedCode === invite.login_code ? "text-green-600" : "text-gray-400 hover:text-blue-600"}`}
                          title="Salin Kode"
                        >
                          {copiedCode === invite.login_code ? <FaCheck/> : <FaCopy/>}
                        </button>
                      </div>
                    </td>

                    {/* Status Batas Login */}
                    <td className="py-3 px-4 text-center align-middle">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                          invite.login_count >= invite.max_logins
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}>
                        {invite.login_count} / {invite.max_logins}
                      </span>
                    </td>

                    {/* Waktu Kirim */}
                    <td className="py-3 px-4 text-gray-500 text-xs align-middle">
                      {formatTanggal(invite.sent_at)}
                    </td>

                    {/* Tombol Hapus / Batalkan (UPDATED: MENGGUNAKAN MODAL) */}
                    <td className="py-3 px-4 text-center align-middle">
                      <button
                        onClick={() => openDeleteModal(invite.id, invite.email)}
                        disabled={deletingId === invite.id}
                        className={`p-2 rounded-lg transition-all ${
                          deletingId === invite.id 
                          ? "bg-gray-100 text-gray-400 cursor-wait" 
                          : "bg-white border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 hover:shadow-sm"
                        }`}
                        title="Batalkan Undangan & Hapus Akses (Super Admin)"
                      >
                        {deletingId === invite.id ? (
                          <FaSpinner className="animate-spin w-4 h-4" />
                        ) : (
                          <FaTrashAlt className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TabUndanganAdmin;