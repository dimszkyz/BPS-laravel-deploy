// File: src/admin/AksesDaftarAdmin/TabHasilAdmin.jsx

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FaSyncAlt,
  FaPoll,
  FaExclamationCircle,
  FaEye,
  FaCopy,
  FaWhatsapp,
  FaFileExcel,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaInfoCircle,
  FaSort,
  FaSortUp,
  FaSortDown,
} from "react-icons/fa";
import * as XLSX from "xlsx";

const API_URL = "https://kompeta.web.bps.go.id";

// ---------- Helpers (Diambil dari HasilUjian.jsx) ----------
const formatTanggal = (isoString) => {
  if (!isoString) return "-";
  try {
    const date = new Date(isoString);
    return date.toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
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

const formatTipeSoal = (tipe) => {
  switch (tipe) {
    case "pilihanGanda":
      return "Pilihan Ganda";
    case "teksSingkat":
      return "Isian Singkat";
    case "esay":
      return "Esai";
    case "soalDokumen":
      return "Upload Dokumen";
    default:
      return tipe || "-";
  }
};

// Grouping logic
const groupDataByUjianThenPeserta = (data) => {
  const groupedByExam = data.reduce((acc, row) => {
    const examId = row.exam_id ?? "unknown";
    const pesertaId = row.peserta_id;
    const bobotSoal = row.bobot || 1; 

    if (!acc[examId]) {
      acc[examId] = {
        keterangan: row.ujian || `Ujian (ID: ${examId})`,
        peserta_map: {},
      };
    }

    if (!acc[examId].peserta_map[pesertaId]) {
      acc[examId].peserta_map[pesertaId] = {
        peserta_id: pesertaId,
        nama: row.nama,
        nohp: row.nohp,
        email: row.email,
        pg_benar: 0,
        total_pg: 0,
        total_bobot_maksimal: 0,
        total_bobot_diperoleh: 0,
        total_soal_count: 0, 
        total_benar_count: 0,
        tipe_soal_set: new Set(),
        submitted_at: row.created_at,
      };
    }

    if (row.tipe_soal) {
      acc[examId].peserta_map[pesertaId].tipe_soal_set.add(row.tipe_soal);
    }

    if (row.tipe_soal === "pilihanGanda" || row.tipe_soal === "teksSingkat") {
      acc[examId].peserta_map[pesertaId].total_pg += 1;
      if (row.benar) {
        acc[examId].peserta_map[pesertaId].pg_benar += 1;
      }
    }
    
    // Hitung Bobot
    acc[examId].peserta_map[pesertaId].total_bobot_maksimal += bobotSoal;
    if (row.benar) {
      acc[examId].peserta_map[pesertaId].total_bobot_diperoleh += bobotSoal;
    }

    // Hitung Kuantitas Soal
    acc[examId].peserta_map[pesertaId].total_soal_count += 1;
    if (row.benar) {
      acc[examId].peserta_map[pesertaId].total_benar_count += 1;
    }

    return acc;
  }, {});

  for (const examId in groupedByExam) {
    const examGroup = groupedByExam[examId];
    examGroup.list_peserta = Object.values(examGroup.peserta_map).map(
      (peserta) => {
        const nilaiAkhirBobot =
          peserta.total_bobot_maksimal > 0
            ? Number(
                (
                  (peserta.total_bobot_diperoleh /
                    peserta.total_bobot_maksimal) *
                  100
                ).toFixed(1)
              )
            : 0;
            
        const skorPgLama =
          peserta.total_pg > 0
            ? Number(((peserta.pg_benar / peserta.total_pg) * 100).toFixed(0))
            : 0;
        
        const listTipeSoal = Array.from(peserta.tipe_soal_set)
          .map(t => formatTipeSoal(t))
          .join(", ");

        return {
          ...peserta,
          skor_pg: skorPgLama, 
          nilai_akhir_bobot: nilaiAkhirBobot,
          tipe_soal_string: listTipeSoal,
        };
      }
    );
    examGroup.list_peserta.sort(
      (a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)
    );
    delete examGroup.peserta_map;
  }
  return groupedByExam;
};

const sanitizeSheetName = (name) =>
  (name || "Sheet").toString().replace(/[\\/*?[\]]/g, "").substring(0, 31);

const prepareDataForExport = (pesertaList) =>
  pesertaList.map((p) => ({
    "Nama Peserta": p.nama,
    "Nomor HP": p.nohp,
    Email: p.email,
    "Waktu Submit": formatTanggal(p.submitted_at),
    "Tipe Soal": p.tipe_soal_string,
    "Soal Benar": `${p.total_benar_count} / ${p.total_soal_count}`,
    "Nilai Akhir (Skala 100)": `${p.nilai_akhir_bobot}%`,
  }));

const badgeColor = (v) => {
  if (v >= 80) return "bg-green-100 text-green-700 border-green-200";
  if (v >= 60) return "bg-yellow-100 text-yellow-700 border-yellow-200";
  return "bg-red-100 text-red-700 border-red-200";
};

const barColor = (v) => {
  if (v >= 80) return "bg-green-500";
  if (v >= 60) return "bg-yellow-500";
  return "bg-red-500";
};

const statusJawabanExport = (row) => {
  if (row.tipe_soal === "esay" || row.tipe_soal === "soalDokumen")
    return "Manual / Belum Dinilai";
  return row.benar ? "Benar" : "Salah";
};

const jawabanExportText = (row) => {
  if (row.tipe_soal === "soalDokumen") {
    return row.jawaban_text
      ? `${API_URL}${row.jawaban_text}`
      : "(Tidak upload file)";
  }
  return row.jawaban_text || "(Tidak Dijawab)";
};

// ---------- Component Utama ----------
const TabHasilAdmin = ({ adminId }) => {
  const [groupedHasil, setGroupedHasil] = useState({});
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExamId, setSelectedExamId] = useState(null);

  // UI states
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("submitted_at");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const fetchData = useCallback(async () => {
    if (!adminId) return;
    setLoading(true);
    try {
      const token = sessionStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/api/hasil?target_admin_id=${adminId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        setRawData([]);
        setGroupedHasil({});
        throw new Error("401 Unauthorized.");
      }

      const data = await res.json();
      setRawData(data || []);
      const groupedData = groupDataByUjianThenPeserta(data || []);
      setGroupedHasil(groupedData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [adminId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!selectedExamId && Object.keys(groupedHasil).length > 0) {
      const firstExamId = Object.keys(groupedHasil)[0];
      setSelectedExamId(firstExamId);
    }
  }, [groupedHasil, selectedExamId]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).catch((err) => {
      console.error("Gagal menyalin teks: ", err);
    });
  };

  const formatWhatsappURL = (nohp) => {
    if (!nohp) return "#";
    let formattedNohp = String(nohp).replace(/[\s-]/g, "");
    if (formattedNohp.startsWith("+")) {
      formattedNohp = formattedNohp.substring(1);
    }
    if (formattedNohp.startsWith("0")) {
      formattedNohp = "62" + formattedNohp.substring(1);
    } else if (!formattedNohp.startsWith("62")) {
      formattedNohp = "62" + formattedNohp;
    }
    return `https://wa.me/${formattedNohp}`;
  };

  // ---------- Export Logic ----------
  const handleExportAll = () => {
    setLoading(true);
    try {
      const wb = XLSX.utils.book_new();

      Object.entries(groupedHasil).forEach(([examId, groupData]) => {
        const summaryData = prepareDataForExport(groupData.list_peserta);
        const wsSummary = XLSX.utils.json_to_sheet(summaryData);
        wsSummary["!cols"] = [
          { wch: 30 }, { wch: 20 }, { wch: 30 }, { wch: 20 }, { wch: 35 }, { wch: 15 }, { wch: 18 },
        ];
        const summarySheetName = sanitizeSheetName(
          `R - ${groupData.keterangan?.substring(0, 20) || "Ujian"} (ID ${examId})`
        );
        XLSX.utils.book_append_sheet(wb, wsSummary, summarySheetName);

        const numericExamId = parseInt(examId, 10);
        const detailData = rawData.filter((row) => row.exam_id === numericExamId);
        if (detailData.length > 0) {
          const detailToExport = detailData.map((row) => ({
            "Nama Peserta": row.nama,
            "Nomor HP": row.nohp,
            Email: row.email,
            "Waktu Submit": formatTanggal(row.created_at),
            "Teks Soal": row.soal_text,
            "Tipe Soal": formatTipeSoal(row.tipe_soal),
            "Bobot Soal": row.bobot || 1,
            "Jawaban Peserta": jawabanExportText(row),
            "Status Jawaban": statusJawabanExport(row),
            "Kunci Jawaban": row.kunci_jawaban_text || "-",
          }));
          const wsDetail = XLSX.utils.json_to_sheet(detailToExport);
          wsDetail["!cols"] = [
            { wch: 30 }, { wch: 20 }, { wch: 30 }, { wch: 20 }, { wch: 50 }, { wch: 15 }, { wch: 10 }, { wch: 40 }, { wch: 18 }, { wch: 30 },
          ];
          const detailSheetName = sanitizeSheetName(
            `D - ${groupData.keterangan?.substring(0, 20) || "Ujian"} (ID ${examId})`
          );
          XLSX.utils.book_append_sheet(wb, wsDetail, detailSheetName);
        }
      });

      XLSX.writeFile(wb, `Rekap_Semua_Ujian_Admin_${adminId}.xlsx`);
    } catch (error) {
      console.error("Gagal mengekspor semua data Excel:", error);
      alert("Gagal mengekspor data.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCombined = (examId, groupData) => {
    try {
      const wb = XLSX.utils.book_new();
      const safeFileName = sanitizeSheetName(groupData.keterangan || "Ujian");

      // Ringkasan
      const summaryData = prepareDataForExport(groupData.list_peserta);
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      wsSummary["!cols"] = [
        { wch: 30 }, { wch: 20 }, { wch: 30 }, { wch: 20 }, { wch: 35 }, { wch: 15 }, { wch: 18 },
      ];
      XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan");

      // Detail
      const numericExamId = parseInt(examId, 10);
      const detailData = rawData.filter((row) => row.exam_id === numericExamId);

      if (detailData.length === 0) {
        alert("Gagal menemukan data detail. Coba refresh halaman.");
        return;
      }

      const detailToExport = detailData.map((row) => ({
        "Nama Peserta": row.nama,
        "Nomor HP": row.nohp,
        Email: row.email,
        "Waktu Submit": formatTanggal(row.created_at),
        "Teks Soal": row.soal_text,
        "Tipe Soal": formatTipeSoal(row.tipe_soal),
        "Bobot Soal": row.bobot || 1,
        "Jawaban Peserta": jawabanExportText(row),
        "Status Jawaban": statusJawabanExport(row),
        "Kunci Jawaban": row.kunci_jawaban_text || "-",
      }));
      const wsDetail = XLSX.utils.json_to_sheet(detailToExport);
      wsDetail["!cols"] = [
        { wch: 30 }, { wch: 20 }, { wch: 30 }, { wch: 20 }, { wch: 50 }, { wch: 15 }, { wch: 10 }, { wch: 40 }, { wch: 18 }, { wch: 30 },
      ];
      XLSX.utils.book_append_sheet(wb, wsDetail, "Detail Jawaban");

      XLSX.writeFile(wb, `Hasil_${safeFileName}_Admin_${adminId}.xlsx`);
    } catch (error) {
      console.error("Gagal mengekspor data gabungan:", error);
      alert("Gagal mengekspor data.");
    }
  };

  // ---------- Derived State ----------
  const selectedGroup = selectedExamId ? groupedHasil[selectedExamId] : null;

  const stats = useMemo(() => {
    if (!selectedGroup) return { count: 0, avg: 0, lastSubmit: "-" };
    const list = selectedGroup.list_peserta || [];
    const count = list.length;
    const avg =
      count > 0
        ? Math.round(list.reduce((a, b) => a + Number(b.nilai_akhir_bobot || 0), 0) / count)
        : 0;
    const last = list[0]?.submitted_at ? formatTanggal(list[0].submitted_at) : "-";
    return { count, avg, lastSubmit: last };
  }, [selectedGroup]);

  const filteredSorted = useMemo(() => {
    if (!selectedGroup) return [];
    const q = search.trim().toLowerCase();
    let list = selectedGroup.list_peserta;

    if (q) {
      list = list.filter((p) => {
        return (
          (p.nama || "").toLowerCase().includes(q) ||
          (p.email || "").toLowerCase().includes(q) ||
          (p.nohp || "").toLowerCase().includes(q)
        );
      });
    }

    list = [...list].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "nama":
          return a.nama?.localeCompare(b.nama || "") * dir;
        case "skor_pg":
          return (Number(a.nilai_akhir_bobot) - Number(b.nilai_akhir_bobot)) * dir;
        case "pg_benar":
          return (Number(a.total_benar_count) - Number(b.total_benar_count)) * dir;
        case "submitted_at":
        default:
          return (
            (new Date(a.submitted_at) - new Date(b.submitted_at)) * dir
          );
      }
    });

    return list;
  }, [selectedGroup, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSorted.slice(start, start + pageSize);
  }, [filteredSorted, currentPage, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, selectedExamId, pageSize]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <FaSort className="inline-block opacity-60" />;
    return sortDir === "asc" ? (
      <FaSortUp className="inline-block" />
    ) : (
      <FaSortDown className="inline-block" />
    );
  };

  // ---------- UI ----------
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        <FaSyncAlt className="animate-spin mr-2" /> Memuat hasil ujian...
      </div>
    );
  }

  if (Object.keys(groupedHasil).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 border-2 border-dashed border-gray-200 rounded-xl">
        <FaExclamationCircle className="text-4xl mb-3 text-gray-300" />
        <span className="text-lg">Belum ada hasil ujian dari admin ini.</span>
      </div>
    );
  }

  return (
    // Wrapper
    <div className="bg-gray-50 w-full flex flex-col rounded-lg overflow-hidden border border-gray-200">
      
      {/* HEADER LAMA DIHAPUS (Icon, Judul, Deskripsi dihilangkan) */}

      {/* FILTER BAR & ACTIONS */}
      <div className="p-6 pt-4 bg-gray-50">
        <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            {/* Dropdown Ujian */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pilih Ujian
              </label>
              <select
                value={selectedExamId || ""}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {Object.entries(groupedHasil).map(([examId, groupData]) => (
                  <option key={examId} value={examId}>
                    {groupData.keterangan}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="flex-[2]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cari Peserta
              </label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama, email, atau nomor HP..."
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            {/* ACTION BUTTONS (Moved here: Export Semua, Ujian Ini, Refresh) */}
            <div className="flex flex-wrap gap-2 w-full lg:w-auto mt-2 lg:mt-0">
              
              {/* Button: Export Semua */}
              <button
                onClick={handleExportAll}
                className="flex-1 lg:flex-none h-[42px] flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-sm whitespace-nowrap"
                title="Export Semua Data"
              >
                <FaFileExcel /> 
                <span className="hidden sm:inline">Export Semua</span>
                <span className="sm:hidden">Semua</span>
              </button>

              {/* Button: Export Ujian Ini */}
              {selectedGroup && (
                <button
                  onClick={() => handleExportCombined(selectedExamId, selectedGroup)}
                  className="flex-1 lg:flex-none h-[42px] flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-sm whitespace-nowrap"
                  title="Export Ujian Ini Saja"
                >
                  <FaFileExcel />
                  <span className="hidden sm:inline">Export Ujian Ini</span>
                  <span className="sm:hidden">Ujian Ini</span>
                </button>
              )}

              {/* Button: Refresh (Visible on Mobile & Desktop) */}
              <button
                onClick={fetchData}
                className="h-[42px] px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm flex items-center justify-center"
                title="Refresh Data"
              >
                <FaSyncAlt />
              </button>

            </div>
          </div>

          {/* Stats */}
          {selectedGroup && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border bg-gray-50">
                <div className="text-xs text-gray-500">Total Peserta</div>
                <div className="text-xl font-semibold text-gray-900">{stats.count}</div>
              </div>
              <div className="p-3 rounded-lg border bg-gray-50">
                <div className="text-xs text-gray-500">Rata-rata Nilai (Skala 100)</div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-2 py-1 border rounded-md text-sm font-semibold ${badgeColor(
                      stats.avg
                    )}`}
                  >
                    {stats.avg}%
                  </span>
                  <div className="flex-1 h-2 bg-gray-200 rounded">
                    <div
                      className={`h-2 rounded ${barColor(stats.avg)}`}
                      style={{ width: `${stats.avg}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-lg border bg-gray-50">
                <div className="text-xs text-gray-500">Submit Terakhir</div>
                <div className="text-sm font-medium text-gray-800">{stats.lastSubmit}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TABLE CARD */}
      {selectedGroup ? (
        <div className="px-6 pb-8 bg-gray-50">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {/* Table controls */}
            <div className="px-4 md:px-5 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b">
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <FaInfoCircle className="text-gray-400" />
                Menampilkan{" "}
                <span className="font-semibold">
                  {pageData.length}
                </span>{" "}
                dari{" "}
                <span className="font-semibold">
                  {filteredSorted.length}
                </span>{" "}
                peserta
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">Baris:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left border-collapse">
                <thead className="bg-gray-50 text-gray-700 uppercase text-xs sticky top-0 z-20">
                  <tr>
                    <th
                      onClick={() => toggleSort("nama")}
                      className="py-3 px-5 border-b cursor-pointer select-none whitespace-nowrap"
                    >
                      <div className="inline-flex items-center gap-2">
                        Nama Peserta <SortIcon col="nama" />
                      </div>
                    </th>
                    <th className="py-3 px-5 border-b whitespace-nowrap">Nomor HP</th>
                    <th className="py-3 px-5 border-b whitespace-nowrap">Email</th>
                    <th
                      onClick={() => toggleSort("submitted_at")}
                      className="py-3 px-5 border-b cursor-pointer select-none whitespace-nowrap"
                    >
                      <div className="inline-flex items-center gap-2">
                        Waktu Submit <SortIcon col="submitted_at" />
                      </div>
                    </th>
                    <th
                      onClick={() => toggleSort("pg_benar")}
                      className="py-3 px-5 border-b cursor-pointer select-none whitespace-nowrap"
                    >
                      <div className="inline-flex items-center gap-2">
                        Soal Benar <SortIcon col="pg_benar" />
                      </div>
                    </th>
                    <th
                      onClick={() => toggleSort("skor_pg")}
                      className="py-3 px-5 border-b cursor-pointer select-none whitespace-nowrap"
                    >
                      <div className="inline-flex items-center gap-2">
                        Nilai Akhir <SortIcon col="skor_pg" />
                      </div>
                    </th>
                    <th className="py-3 px-5 text-center border-b whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pageData.map((peserta) => (
                    <tr key={peserta.peserta_id} className="hover:bg-gray-50">
                      <td className="py-3 px-5 font-medium text-gray-800">
                        {peserta.nama || "-"}
                      </td>
                      <td className="py-3 px-5 whitespace-nowrap">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-gray-700">{peserta.nohp || "-"}</span>
                          {peserta.nohp && (
                            <a
                              href={formatWhatsappURL(peserta.nohp)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-500 hover:text-green-700"
                              title="Kirim WhatsApp"
                            >
                              <FaWhatsapp />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate max-w-[200px] text-gray-700">
                            {peserta.email || "-"}
                          </span>
                          {peserta.email && (
                            <button
                              onClick={() => handleCopy(peserta.email)}
                              className="text-gray-500 hover:text-blue-600"
                              title="Salin email"
                            >
                              <FaCopy />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-5 whitespace-nowrap text-gray-700">
                        {formatTanggal(peserta.submitted_at)}
                      </td>
                      <td className="py-3 px-5 whitespace-nowrap font-semibold text-gray-800">
                        {peserta.total_benar_count} / {peserta.total_soal_count}
                      </td>
                      <td className="py-3 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2 py-1 border rounded-md text-xs font-bold ${badgeColor(
                              Number(peserta.nilai_akhir_bobot || 0)
                            )}`}
                          >
                            {Number(peserta.nilai_akhir_bobot || 0)}%
                          </span>
                          <div className="w-28 h-2 bg-gray-200 rounded">
                            <div
                              className={`h-2 rounded ${barColor(
                                Number(peserta.nilai_akhir_bobot || 0)
                              )}`}
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.max(0, Number(peserta.nilai_akhir_bobot || 0))
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-center">
                        <Link
                          to={`/admin/hasil/${peserta.peserta_id}`}
                          state={{ targetAdminId: adminId }}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md text-blue-600 hover:bg-blue-50 hover:text-blue-800"
                          title="Lihat detail jawaban"
                        >
                          <FaEye />
                        </Link>
                      </td>
                    </tr>
                  ))}

                  {pageData.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">
                        Tidak ada data yang cocok dengan pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 md:px-5 py-3 border-t flex items-center justify-between bg-white">
              <div className="text-sm text-gray-600">
                Halaman <span className="font-semibold">{currentPage}</span> dari{" "}
                <span className="font-semibold">{totalPages}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-2 px-3 py-2 border rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <FaChevronLeft /> Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-2 px-3 py-2 border rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Next <FaChevronRight />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 mt-10">
          Pilih ujian untuk melihat hasilnya.
        </div>
      )}
    </div>
  );
};

export default TabHasilAdmin;