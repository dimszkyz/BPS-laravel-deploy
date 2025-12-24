// File: src/admin/DaftarUndangan.jsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  FaSyncAlt,
  FaExclamationCircle,
  FaCopy,
  FaCheck,
  FaHistory,
  FaListUl,
  FaTrashAlt,
  FaExclamationTriangle,
  FaChevronLeft,
  FaChevronRight,
  FaSearch,
  FaFileDownload, 
} from "react-icons/fa";

const API_URL = "http://localhost:8000";

const DaftarUndangan = ({ refreshTrigger }) => {
  // --- STATE DATA ---
  const [allData, setAllData] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedCode, setCopiedCode] = useState(null);

  // --- STATE PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); 

  // --- STATE PENCARIAN ---
  const [searchQuery, setSearchQuery] = useState("");

  // --- STATE DELETE ---
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // --- Fetch Data ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = sessionStorage.getItem("adminToken");
      const response = await fetch(`${API_URL}/api/invite/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        let errorMsg = "Gagal memuat daftar undangan.";
        try {
          const errData = await response.json();
          errorMsg = errData.message || errorMsg;
        } catch (e) {}
        throw new Error(errorMsg);
      }
      const data = await response.json();
      setAllData(data);
      setCurrentPage(1); 
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  // --- LOGIKA FILTERING ---
  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return allData;

    return allData.filter((item) => {
      const email = (item.email || "").toLowerCase();
      const code = (item.login_code || "").toLowerCase();
      const examName = (item.keterangan_ujian || "").toLowerCase();
      return email.includes(query) || code.includes(query) || examName.includes(query);
    });
  }, [allData, searchQuery]);

  // --- HELPER FORMAT TANGGAL ---
  const formatTanggal = (isoString) => {
    try {
      if (!isoString || isoString === '-') return '-';
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

  // --- [PERBAIKAN] FUNGSI EXPORT CSV PER KATEGORI ---
  // Menerima examId dan examName agar export spesifik per ujian
  const handleExportCSV = (examId, examName) => {
    // Filter data global berdasarkan ID Ujian yang diklik
    // Menggunakan filteredData agar tetap menghormati hasil pencarian (jika ada search)
    const dataToExport = filteredData.filter(item => String(item.exam_id) === String(examId));

    if (dataToExport.length === 0) {
      alert("Tidak ada data pada kategori ini untuk diekspor.");
      return;
    }

    // Header Kolom (A, B, C, D)
    const headers = ["Email Peserta", "Kode Login", "Batas", "Waktu Kirim", "Keterangan Ujian"];
    
    // Mapping Baris Data
    const rows = dataToExport.map(item => [
      item.email,
      item.login_code,
      `${item.login_count} / ${item.max_logins}`, 
      formatTanggal(item.sent_at),
      item.keterangan_ujian
    ]);

    const csvContent = [
      "sep=,", 
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // Bersihkan nama file dari karakter aneh
    const safeName = examName.replace(/[^a-z0-9]/gi, '_').substring(0, 50);

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Undangan_${safeName}_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // --- LOGIKA PAGINATION & GROUPING ---
  const groupedInvitations = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

    return currentItems.reduce((acc, invite) => {
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
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleCopy = (loginCode) => {
    navigator.clipboard.writeText(loginCode).then(
      () => {
        setCopiedCode(loginCode);
        setTimeout(() => setCopiedCode(null), 1500);
      },
      (err) => alert("Gagal menyalin kode.")
    );
  };

  const onClickDelete = (id, email) => {
    setItemToDelete({ id, email });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    const { id } = itemToDelete;
    setDeletingId(id);
    try {
      const token = sessionStorage.getItem("adminToken");
      const response = await fetch(`${API_URL}/api/invite/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Gagal membatalkan undangan.");
      fetchData();
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (err) {
      alert(`Gagal: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="w-full relative flex flex-col min-h-[400px]">
      {/* Header Section */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2 self-start sm:self-center">
          <FaHistory className="text-gray-500" /> Riwayat & Status Undangan
        </h3>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {/* SEARCH */}
          <div className="relative w-full sm:w-auto flex-1 sm:flex-none">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input 
              type="text"
              placeholder="Cari email / kode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-48 pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* [MODIFIKASI] Tombol Export Global DIHAPUS dari sini */}
            
            <select 
              value={itemsPerPage}
              onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
              }}
              className="flex-1 sm:flex-none text-xs border border-gray-300 rounded px-2 py-1.5 bg-white text-gray-600 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={5}>5 / hal</option>
              <option value={10}>10 / hal</option>
              <option value={20}>20 / hal</option>
              <option value={50}>50 / hal</option>
            </select>

            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-3 py-1.5 bg-white border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 hover:text-blue-600 transition text-sm font-medium shadow-sm"
            >
              <FaSyncAlt className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 flex-1">
        {loading && (
          <div className="text-center py-8 text-gray-500 flex flex-col items-center">
            <FaSyncAlt className="animate-spin mb-2 w-6 h-6 text-blue-500" />
            Memuat data riwayat...
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-4 rounded-lg border border-red-200 flex items-center gap-2">
            <FaExclamationCircle className="text-lg" /> {error}
          </div>
        )}

        {!loading && !error && filteredData.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-500 font-medium">
                {allData.length === 0 ? "Belum ada undangan yang dikirim." : "Data tidak ditemukan."}
            </p>
            {allData.length > 0 && <p className="text-sm text-gray-400 mt-1">Coba kata kunci lain.</p>}
          </div>
        )}

        {!loading && !error && Object.keys(groupedInvitations).length > 0 && (
          <div className="space-y-8">
            {Object.entries(groupedInvitations).map(([examId, groupData]) => (
              <div
                key={examId}
                className="border border-gray-200 rounded-lg overflow-hidden shadow-sm animate-fade-in"
              >
                {/* [MODIFIKASI] Header Card Ujian dengan Tombol Export Kanan */}
                <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex justify-between items-center gap-2">
                  <div className="flex items-center gap-2">
                    <FaListUl className="text-blue-600" />
                    <h4 className="font-semibold text-blue-800 text-sm md:text-base">
                      {groupData.keterangan}
                    </h4>
                  </div>
                  
                  {/* Tombol Export Per Kategori */}
                  <button
                    onClick={() => handleExportCSV(examId, groupData.keterangan)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition text-xs font-medium shadow-sm"
                    title={`Unduh data ${groupData.keterangan} ke Excel (CSV)`}
                  >
                    <FaFileDownload /> <span className="hidden sm:inline">Export</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider font-semibold">
                      <tr>
                        <th className="py-3 px-4 w-[35%]">Email Peserta</th>
                        <th className="py-3 px-4 w-[20%]">Kode Login</th>
                        <th className="py-3 px-4 w-[15%] text-center">Batas</th>
                        <th className="py-3 px-4 w-[20%]">Waktu Kirim</th>
                        <th className="py-3 px-4 w-[10%] text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {groupData.list.map((invite) => (
                        <tr key={invite.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 text-gray-800 font-medium break-all align-middle">
                            {invite.email}
                          </td>
                          <td className="py-3 px-4 align-middle">
                            <div className="flex items-center gap-2 bg-gray-100 w-fit px-2 py-1 rounded border border-gray-200">
                              <span className="font-mono text-gray-700 tracking-wide select-all">
                                {invite.login_code}
                              </span>
                              <button
                                onClick={() => handleCopy(invite.login_code)}
                                className={`ml-1 ${
                                  copiedCode === invite.login_code
                                    ? "text-green-600"
                                    : "text-gray-400 hover:text-blue-600"
                                }`}
                                title="Salin Kode"
                              >
                                {copiedCode === invite.login_code ? <FaCheck /> : <FaCopy />}
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center align-middle">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                                invite.login_count >= invite.max_logins
                                  ? "bg-red-100 text-red-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {invite.login_count} / {invite.max_logins}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-500 text-xs align-middle">
                            {formatTanggal(invite.sent_at)}
                          </td>
                          <td className="py-3 px-4 text-center align-middle">
                            <button
                              onClick={() => onClickDelete(invite.id, invite.email)}
                              disabled={deletingId === invite.id}
                              className={`p-2 rounded-lg transition-all ${
                                deletingId === invite.id
                                  ? "bg-gray-100 text-gray-400 cursor-wait"
                                  : "bg-white border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 hover:shadow-sm"
                              }`}
                              title="Batalkan Undangan"
                            >
                              {deletingId === invite.id ? (
                                <FaSyncAlt className="animate-spin w-4 h-4" />
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
        )}
      </div>

      {/* FOOTER: PAGINATION */}
      {!loading && !error && filteredData.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-600">
                Menampilkan <span className="font-semibold">{(currentPage - 1) * itemsPerPage + 1}</span> sampai <span className="font-semibold">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> dari <span className="font-semibold">{filteredData.length}</span> data
                {searchQuery && <span className="text-gray-400 ml-1 text-xs">(difilter dari {allData.length} total)</span>}
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="inline-flex items-center gap-2 px-3 py-2 border rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition"
                >
                    <FaChevronLeft /> Sebelumnya
                </button>

                <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                         let pageNum = i + 1;
                         if (totalPages > 5 && currentPage > 3) {
                             pageNum = currentPage - 3 + i;
                             if(pageNum > totalPages) return null; 
                         }
                         return (
                            <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`w-8 h-8 flex items-center justify-center text-sm font-medium rounded-md transition ${
                                    currentPage === pageNum
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                                }`}
                            >
                                {pageNum}
                            </button>
                        );
                    })}
                </div>

                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center gap-2 px-3 py-2 border rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition"
                >
                    Selanjutnya <FaChevronRight />
                </button>
            </div>
        </div>
      )}

      {/* MODAL DELETE */}
      {showDeleteModal && itemToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center transform transition-all scale-100">
            <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-yellow-100 mb-4">
              <FaExclamationTriangle className="text-yellow-500 text-3xl" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Batalkan Undangan?
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed text-sm">
              Apakah Anda yakin ingin membatalkan undangan untuk <br />
              <span className="font-semibold text-gray-900">
                {itemToDelete.email}
              </span>
              ? <br />
              <span className="text-xs text-red-500 mt-1 block">
                (Peserta tidak akan bisa login lagi)
              </span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setItemToDelete(null);
                }}
                className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition duration-200"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deletingId !== null}
                className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition duration-200 flex justify-center items-center gap-2"
              >
                {deletingId ? <FaSyncAlt className="animate-spin" /> : <><FaTrashAlt className="text-sm" /> Ya, Batalkan</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DaftarUndangan;