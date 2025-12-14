// File: src/admin/AksesDaftarAdmin/TabUjianAdmin.jsx

import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // 1. Tambahkan useLocation
import {
    FaSpinner,
    FaEdit,
    FaTrash,
    FaExclamationTriangle,
    FaCheckCircle
} from "react-icons/fa";

const API_URL = "https://kompeta.web.bps.go.id";

// ===============================================
// KOMPONEN MODAL (Sama seperti di DaftarSoal)
// ===============================================
const KonfirmasiModal = ({ show, message, onCancel, onConfirm }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px]">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
                <div className="flex items-center gap-3 mb-4">
                    <FaExclamationTriangle className="text-yellow-500 text-2xl" />
                    <h3 className="text-lg font-semibold text-gray-800">Konfirmasi</h3>
                </div>
                <p className="text-gray-700 mb-6">{message}</p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

const TabUjianAdmin = ({ adminId }) => {
    const navigate = useNavigate();
    const location = useLocation(); // 2. Inisialisasi location
    const [daftarUjian, setDaftarUjian] = useState([]);
    const [loading, setLoading] = useState(true);

    // State untuk Modal & Toast
    const [modalState, setModalState] = useState({
        show: false,
        message: "",
        onConfirm: () => { },
    });
    const [successMessage, setSuccessMessage] = useState("");

    // =============================
    // Helper tanggal
    // =============================
    const pad2 = (n) => String(n).padStart(2, "0");

    const toLocalDateOnly = (val) => {
        const d = new Date(val);
        if (!isNaN(d)) {
            return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
        }
        const s = String(val || "");
        return s.includes("T") ? s.slice(0, 10) : s;
    };

    const formatTanggal = (tgl) => {
        if (!tgl) return "-";
        const [y, m, d] = toLocalDateOnly(tgl).split("-");
        if (!y || !m || !d) return tgl;
        return `${d}-${m}-${y}`;
    };

    // =============================
    // Fetch Data
    // =============================
    const fetchUjian = async () => {
        if (!adminId) return;

        try {
            setLoading(true);
            const token = sessionStorage.getItem("adminToken");
            const res = await fetch(`${API_URL}/api/ujian?target_admin_id=${adminId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                const sortedData = [...data].sort(
                    (a, b) => new Date(a.created_at) - new Date(b.created_at)
                );
                setDaftarUjian(sortedData);
            } else {
                setDaftarUjian([]);
            }
        } catch (err) {
            console.error("Gagal ambil data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUjian();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adminId]);

    // =============================
    // Logika Hapus & Modal
    // =============================
    const handleCloseModal = () => {
        setModalState({ show: false, message: "", onConfirm: () => { } });
    };

    const handleConfirmModal = () => {
        modalState.onConfirm();
        handleCloseModal();
    };

    const prosesHapus = async (id) => {
        try {
            const token = sessionStorage.getItem("adminToken");
            if (!token) throw new Error("Token tidak ditemukan.");

            const res = await fetch(`${API_URL}/api/ujian/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Gagal hapus ujian");

            setSuccessMessage("Ujian berhasil dihapus");
            setTimeout(() => setSuccessMessage(""), 3000);

            setDaftarUjian((prev) => prev.filter((u) => u.id !== id));
        } catch (err) {
            console.error("Error hapus:", err);
            alert("Terjadi kesalahan: " + err.message);
        }
    };

    const handleDeleteClick = (id) => {
        setModalState({
            show: true,
            message: "Sebagai Super Admin, apakah Anda yakin ingin menghapus ujian milik admin ini secara permanen?",
            onConfirm: () => prosesHapus(id),
        });
    };

    // =============================
    // Logika Edit (Navigasi Pintar)
    // =============================
    const handleEditClick = (ujianId) => {
        // 3. Kirim state 'fromSuperAdmin' saat navigasi
        // Ini akan dibaca oleh EditSoal.jsx untuk tombol kembalinya
        navigate(`/admin/edit-soal/${ujianId}`, {
            state: {
                fromSuperAdmin: true,
                prevPath: location.pathname
            }
        });
    };

    // =============================
    // RENDER
    // =============================
    if (loading) {
        return (
            <div className="p-10 text-center text-gray-500">
                <FaSpinner className="animate-spin inline mr-2" /> Memuat daftar ujian...
            </div>
        );
    }

    if (daftarUjian.length === 0) {
        return (
            <div className="p-10 text-center text-gray-600 bg-white rounded-xl shadow-md border border-gray-200">
                Admin ini belum membuat ujian.
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden relative">

            {/* Toast Notification */}
            {successMessage && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
                    <div className="flex items-center gap-3 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
                        <FaCheckCircle className="text-white" />
                        <span className="font-semibold text-sm">{successMessage}</span>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi */}
            <KonfirmasiModal
                show={modalState.show}
                message={modalState.message}
                onCancel={handleCloseModal}
                onConfirm={handleConfirmModal}
            />

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left border-collapse border border-gray-200 table-fixed">
                    <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                        <tr>
                            <th className="py-3 px-5 w-[50px] border border-gray-200">No</th>
                            <th className="py-3 px-5 w-[30%] border border-gray-200">Keterangan</th>
                            <th className="py-3 px-5 w-[15%] border border-gray-200">Tanggal Mulai</th>
                            <th className="py-3 px-5 w-[15%] border border-gray-200">Tanggal Akhir</th>
                            <th className="py-3 px-5 w-[20%] border border-gray-200">Jendela Waktu</th>
                            <th className="py-3 px-5 w-[10%] border border-gray-200">Durasi</th>
                            <th className="py-3 px-5 w-[150px] text-center border border-gray-200">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {daftarUjian.map((u, index) => (
                            <tr
                                key={u.id}
                                className="hover:bg-gray-50 align-top border border-gray-200"
                            >
                                <td className="py-3 px-5 text-gray-700 border border-gray-200">
                                    {index + 1}
                                </td>
                                <td className="py-3 px-5 font-medium text-gray-800 whitespace-normal break-words border border-gray-200">
                                    {u.keterangan}
                                    {!!u.acak_soal && (
                                        <div className="mt-1">
                                            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                                                Acak Soal
                                            </span>
                                        </div>
                                    )}
                                </td>
                                <td className="py-3 px-5 whitespace-nowrap border border-gray-200">
                                    {formatTanggal(u.tanggal)}
                                </td>
                                <td className="py-3 px-5 whitespace-nowrap border border-gray-200">
                                    {formatTanggal(u.tanggal_berakhir)}
                                </td>
                                <td className="py-3 px-5 whitespace-nowrap border border-gray-200">
                                    {(u.jam_mulai || "--:--") + " – " + (u.jam_berakhir || "--:--")}
                                </td>
                                <td className="py-3 px-5 whitespace-nowrap border border-gray-200">
                                    {u.durasi ? `${u.durasi} menit` : "-"}
                                </td>

                                {/* Kolom Aksi */}
                                <td className="py-3 px-5 text-center border border-gray-200">
                                    <div className="flex justify-center gap-3">
                                        <button
                                            onClick={() => handleEditClick(u.id)} // 4. Panggil fungsi handleEditClick
                                            className="text-blue-600 hover:text-blue-800 transition"
                                            title="Edit Ujian (Super Admin)"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(u.id)}
                                            className="text-red-500 hover:text-red-700 transition"
                                            title="Hapus Ujian (Super Admin)"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TabUjianAdmin;