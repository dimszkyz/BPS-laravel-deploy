import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaClock,
  FaCheckCircle,
  FaRegCircle,
  FaUser,
  FaPhoneAlt,
  FaEnvelope,
  FaCalendarAlt,
  FaRegClock,
  FaInfoCircle,
  FaFileAlt,
  FaTrash,
  FaExclamationCircle, // Icon untuk error
  FaTimes // Icon close
} from "react-icons/fa";
import SubmitUjianModal from "../component/submitujian.jsx";

const API_URL = "https://kompeta.web.bps.go.id";

// --- FUNGSI SHUFFLE ---
const shuffleArray = (array) => {
  let currentIndex = array.length,
    randomIndex;
  const newArray = [...array];
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [newArray[currentIndex], newArray[randomIndex]] = [
      newArray[randomIndex],
      newArray[currentIndex],
    ];
  }
  return newArray;
};

// --- KOMPONEN StatusUjianBox ---
const StatusUjianBox = ({
  totalSoal,
  jumlahTerjawab,
  timerDisplay,
  soalList,
  jawabanUser,
  dokumenFiles,
  raguRagu,
  currentIndex,
  onNavClick,
  onSubmit,
}) => {
  const getStatusSoal = (idx) => {
    const soal = soalList[idx];
    const soalId = soal?.id;
    if (!soalId) return "belum";

    if (raguRagu[soalId]) return "ragu";

    // ✅ Cek status soal dokumen berdasarkan file yang ada di state
    if (soal?.tipeSoal === "soalDokumen") {
      const files = dokumenFiles?.[soalId] || [];
      return files.length > 0 ? "jawab" : "belum";
    }

    if (jawabanUser[soalId] && jawabanUser[soalId] !== "") return "jawab";
    return "belum";
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-6">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Status Ujian
      </h3>
      <div className="mt-4 space-y-2 text-sm text-gray-700">
        <p>
          Soal dikerjakan:{" "}
          <span className="font-bold text-gray-900">
            {jumlahTerjawab} / {totalSoal}
          </span>
        </p>
        <p>
          Waktu tersisa:{" "}
          <span className="font-bold text-blue-600">{timerDisplay}</span>
        </p>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-blue-600 border border-blue-700"></span>
          <span>Aktif</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-green-500 border border-green-600"></span>
          <span>Sudah jawab</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-yellow-400 border border-yellow-500"></span>
          <span>Ragu</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-gray-100 border border-gray-300"></span>
          <span>Belum</span>
        </div>
      </div>
      <div className="mt-5 pt-5 border-t border-gray-200">
        <div className="flex flex-wrap gap-2.5">
          {soalList.map((_, idx) => {
            const status = getStatusSoal(idx);
            const isActive = currentIndex === idx;
            let baseClasses =
              "w-9 h-9 flex items-center justify-center rounded-md text-sm font-semibold cursor-pointer transition";
            if (isActive) {
              baseClasses += " bg-blue-600 text-white ring-2 ring-blue-300";
            } else if (status === "ragu") {
              baseClasses +=
                " bg-yellow-400 text-yellow-900 hover:bg-yellow-500";
            } else if (status === "jawab") {
              baseClasses += " bg-green-500 text-white hover:bg-green-600";
            } else {
              baseClasses +=
                " bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200";
            }
            return (
              <button
                key={idx}
                className={baseClasses}
                onClick={() => onNavClick(idx)}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-6">
        <button
          onClick={onSubmit}
          className="w-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white text-sm font-semibold px-4 py-3 rounded-lg"
        >
          Kumpulkan Jawaban
        </button>
      </div>
    </div>
  );
};

// --- KOMPONEN InfoPesertaBox ---
const InfoPesertaBox = ({ peserta }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Data Peserta
      </h3>
      <ul className="space-y-3 text-sm">
        <li className="flex items-center gap-3 text-gray-700">
          <FaUser className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <span className="font-medium break-words min-w-0">
            {peserta.nama}
          </span>
        </li>
        <li className="flex items-center gap-3 text-gray-700">
          <FaPhoneAlt className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <span className="font-medium">{peserta.nohp}</span>
        </li>
        <li className="flex items-center gap-3 text-gray-700">
          <FaEnvelope className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <span className="font-medium break-words min-w-0">
            {peserta.email}
          </span>
        </li>
      </ul>
    </div>
  );
};

// --- KOMPONEN InfoUjianBox ---
const InfoUjianBox = ({
  keterangan,
  tanggal,
  jamMulai,
  jamBerakhir,
  durasi,
  formatTanggal,
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Informasi Ujian
      </h3>
      <ul className="space-y-3 text-sm">
        <li className="flex items-start gap-3 text-gray-700">
          <FaInfoCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <span className="font-medium break-words min-w-0">
            {keterangan}
          </span>
        </li>
        <li className="flex items-center gap-3 text-gray-700">
          <FaCalendarAlt className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <span className="font-medium">{formatTanggal(tanggal)}</span>
        </li>
        <li className="flex items-center gap-3 text-gray-700">
          <FaClock className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <span className="font-medium">
            {jamMulai} – {jamBerakhir} (WIB)
          </span>
        </li>
        <li className="flex items-center gap-3 text-gray-700">
          <FaRegClock className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <span className="font-medium">Durasi: {durasi} menit</span>
        </li>
      </ul>
    </div>
  );
};

// --- KOMPONEN UTAMA: PartSoal ---
const PartSoal = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [durasiMenit, setDurasiMenit] = useState(0);
  const [windowStartMs, setWindowStartMs] = useState(null);
  const [windowEndMs, setWindowEndMs] = useState(null);
  const [displayTanggal, setDisplayTanggal] = useState("");
  const [displayJamMulai, setDisplayJamMulai] = useState("");
  const [displayJamBerakhir, setDisplayJamBerakhir] = useState("");
  const [soalList, setSoalList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [jawabanUser, setJawabanUser] = useState({});
  const [dokumenFiles, setDokumenFiles] = useState({}); // { soalId: [{name, path, uploaded: true}] }
  
  const [isDragOver, setIsDragOver] = useState(false);
  const dokumenInputRef = useRef(null);

  const [raguRagu, setRaguRagu] = useState({});
  const [sisaDetik, setSisaDetik] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pesertaInfo, setPesertaInfo] = useState({
    nama: "Memuat...",
    nohp: "Memuat...",
    email: "Memuat...",
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAutoSubmitModal, setShowAutoSubmitModal] = useState(false);
  const [autoSubmitCountdown, setAutoSubmitCountdown] = useState(10);
  
  // -- NEW STATE FOR NOTIFICATION --
  const [notification, setNotification] = useState(null); // { message, type: 'error'|'success' }
  const notificationTimeoutRef = useRef(null);

  const countdownIntervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  // --- Helper ---
  const pad2 = (n) => String(n).padStart(2, "0");
  const toLocalDateOnly = (val) => {
    const d = new Date(val);
    if (!isNaN(d)) {
      return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(
        d.getDate()
      )}`;
    }
    const s = String(val || "");
    return s.includes("T") ? s.slice(0, 10) : s;
  };
  const formatTanggal = (raw) => {
    if (!raw) return "-";
    const [y, m, d] = toLocalDateOnly(raw).split("-");
    if (!y || !m || !d) return raw;
    return `${d}/${m}/${y}`;
  };
  const padTime = (t) => (t?.length === 5 ? `${t}:00` : t || "00:00:00");

  // --- SHOW NOTIFICATION HELPER ---
  const showNotification = (message, type = 'error') => {
    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    
    setNotification({ message, type });
    
    // Auto hide after 4 seconds
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const getProgressKey = useCallback(() => {
    const peserta = JSON.parse(localStorage.getItem("pesertaData"));
    const pesertaId = peserta?.id;
    if (!pesertaId) {
      throw new Error(
        "getProgressKey: ID Peserta tidak ditemukan di localStorage."
      );
    }
    return `progress_${pesertaId}_${id}`;
  }, [id]);

  const getOrderKey = useCallback(() => {
    const peserta = JSON.parse(localStorage.getItem("pesertaData"));
    const pesertaId = peserta?.id;
    if (!pesertaId) {
      throw new Error("getOrderKey: ID Peserta tidak ditemukan di localStorage.");
    }
    return `order_${pesertaId}_${id}`;
  }, [id]);

  const getOptionOrderKey = useCallback(
    (soalId) => {
      const peserta = JSON.parse(localStorage.getItem("pesertaData"));
      const pesertaId = peserta?.id;
      if (!pesertaId) {
        throw new Error(
          "getOptionOrderKey: ID Peserta tidak ditemukan di localStorage."
        );
      }
      return `order_opsi_${pesertaId}_${id}_${soalId}`;
    },
    [id]
  );

  // =======================================================
  // FETCH DETAIL UJIAN (PUBLIC)
  // =======================================================
  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);

        const res = await fetch(`${API_URL}/api/ujian/public/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Gagal memuat ujian.");

        setKeterangan(data.keterangan || "");
        setDisplayTanggal(data.tanggal || "");
        setDisplayJamMulai(data.jam_mulai || "");
        setDisplayJamBerakhir(data.jam_berakhir || "");

        const durasiDariDb = parseInt(data.durasi, 10) || 0;
        if (durasiDariDb <= 0) {
          throw new Error("Durasi ujian tidak valid (0 menit).");
        }
        setDurasiMenit(durasiDariDb);

        const tglMulai = toLocalDateOnly(data.tanggal);
        const tglBerakhir = toLocalDateOnly(data.tanggal_berakhir);
        const jm = padTime(data.jam_mulai);
        const jb = padTime(data.jam_berakhir);
        if (!tglMulai || !tglBerakhir || !jm || !jb) {
          throw new Error("Jadwal ujian (tanggal/jam) tidak lengkap.");
        }
        const startWindow = new Date(`${tglMulai}T${jm}`).getTime();
        const endWindow = new Date(`${tglBerakhir}T${jb}`).getTime();
        if (endWindow <= startWindow) {
          throw new Error(
            "Jadwal ujian tidak valid (waktu berakhir < waktu mulai)."
          );
        }
        setWindowStartMs(startWindow);
        setWindowEndMs(endWindow);

        let soalListDariApi = data.soalList || [];
        let soalListTerurut;
        const orderKey = getOrderKey();
        const savedOrderJson = localStorage.getItem(orderKey);
        const isAcakSoal =
          data.acak_soal === 1 ||
          data.acak_soal === "1" ||
          data.acak_soal === true;

        const isAcakOpsi =
          data.acak_opsi === 1 ||
          data.acak_opsi === "1" ||
          data.acak_opsi === true ||
          data.acak_opsi === "true";

        if (savedOrderJson) {
          const savedSoalIds = JSON.parse(savedOrderJson);
          const soalMap = new Map(soalListDariApi.map((s) => [s.id, s]));
          soalListTerurut = savedSoalIds
            .map((sid) => soalMap.get(sid))
            .filter(Boolean);
        } else if (isAcakSoal) {
          const shuffledList = shuffleArray(soalListDariApi);
          const shuffledIds = shuffledList.map((s) => s.id);
          localStorage.setItem(orderKey, JSON.stringify(shuffledIds));
          soalListTerurut = shuffledList;
        } else {
          soalListTerurut = soalListDariApi;
        }

        const mapped = soalListTerurut.map((s) => {
          let pilihanNormalized = [];
          if (Array.isArray(s.pilihan)) {
            if (s.pilihan.length > 0 && typeof s.pilihan[0] === "object") {
              pilihanNormalized = s.pilihan.map((p, idx) => ({
                id: p.id ?? idx + 1,
                text: p.text ?? p,
              }));
            } else {
              pilihanNormalized = s.pilihan.map((pText, idx) => ({
                id: idx + 1,
                text: pText,
              }));
            }
          }

          let pilihanTerurut = pilihanNormalized;
          if (
            isAcakOpsi &&
            (s.tipeSoal || "pilihanGanda") === "pilihanGanda" &&
            pilihanNormalized.length > 1
          ) {
            try {
              const opsiOrderKey = getOptionOrderKey(s.id);
              const savedOpsiOrderJson = localStorage.getItem(opsiOrderKey);

              if (savedOpsiOrderJson) {
                const savedOpsiIds = JSON.parse(savedOpsiOrderJson);
                const opsiMap = new Map(
                  pilihanNormalized.map((o) => [o.id, o])
                );
                const ordered = savedOpsiIds
                  .map((oid) => opsiMap.get(oid))
                  .filter(Boolean);

                if (ordered.length === pilihanNormalized.length) {
                  pilihanTerurut = ordered;
                } else {
                  pilihanTerurut = pilihanNormalized;
                }
              } else {
                const shuffledOpsi = shuffleArray(pilihanNormalized);
                const shuffledOpsiIds = shuffledOpsi.map((o) => o.id);
                localStorage.setItem(
                  opsiOrderKey,
                  JSON.stringify(shuffledOpsiIds)
                );
                pilihanTerurut = shuffledOpsi;
              }
            } catch (e) {
              console.warn("Gagal mengacak opsi:", e.message);
              pilihanTerurut = pilihanNormalized;
            }
          }

          return {
            id: s.id,
            tipeSoal: s.tipeSoal || "pilihanGanda",
            soalText: s.soalText || "",
            // --- FIX 1: Logika Gambar (Cek apakah sudah ada http) ---
            gambarUrl: s.gambar 
                ? (s.gambar.startsWith('http') ? s.gambar : `${API_URL}${s.gambar}`) 
                : null,
            pilihan: pilihanTerurut,
            fileConfig: s.fileConfig || {}, 
          };
        });

        setSoalList(mapped);

        const progressKey = getProgressKey();
        const savedProgress =
          JSON.parse(localStorage.getItem(progressKey)) || {};
        
        const initJawab = {};
        const initRagu = {};
        const initDokumenFiles = {}; // Untuk restore file di UI

        mapped.forEach((soal) => {
          const soalId = soal.id;
          const savedAns = savedProgress.jawabanUser?.[soalId] || "";
          
          initJawab[soalId] = savedAns;
          initRagu[soalId] = savedProgress.raguRagu?.[soalId] || false;

          // 🟢 LOGIKA RESTORE DOKUMEN: Parse JSON Path dari LocalStorage
          if (soal.tipeSoal === "soalDokumen" && savedAns) {
            try {
                // savedAns harusnya string JSON array path: '["/uploads/a.pdf"]'
                if (savedAns.startsWith('[') && savedAns.endsWith(']')) {
                    const paths = JSON.parse(savedAns);
                    if (Array.isArray(paths)) {
                        initDokumenFiles[soalId] = paths.map(p => ({
                            name: p.split('/').pop(), // Ambil nama file dari path
                            path: p,
                            uploaded: true
                        }));
                    }
                } else if (savedAns.trim() !== "") {
                    // Fallback untuk format lama (single string)
                    initDokumenFiles[soalId] = [{
                        name: savedAns.split('/').pop(),
                        path: savedAns,
                        uploaded: true
                    }];
                }
            } catch (e) {
                console.error("Gagal restore dokumen:", e);
            }
          }
        });

        setJawabanUser(initJawab);
        setRaguRagu(initRagu);
        setDokumenFiles(initDokumenFiles);

        const nowMs = Date.now();
        if (nowMs < startWindow) {
          throw new Error("Ujian belum dimulai.");
        }
        if (nowMs > endWindow) {
          throw new Error("Jendela waktu untuk memulai ujian sudah ditutup.");
        }

        let startTimeMs = savedProgress.startTimeMs;
        if (!startTimeMs) {
          startTimeMs = nowMs;
          savedProgress.startTimeMs = startTimeMs;
          localStorage.setItem(progressKey, JSON.stringify(savedProgress));
        }
        const durationEndMs = startTimeMs + durasiDariDb * 60 * 1000;
        const actualEndMs = durationEndMs;

        if (nowMs > actualEndMs) {
          setSisaDetik(0);
        } else {
          const sisa = Math.max(0, Math.floor((actualEndMs - nowMs) / 1000));
          setSisaDetik(sisa);
        }

        try {
          const dataPeserta = JSON.parse(localStorage.getItem("pesertaData"));
          if (dataPeserta && dataPeserta.nama) {
            setPesertaInfo({
              nama: dataPeserta.nama,
              nohp: dataPeserta.nohp,
              email: dataPeserta.email,
            });
          } else {
            throw new Error("Data peserta tidak ditemukan di localStorage.");
          }
        } catch (e) {
          console.warn("Gagal memuat data peserta:", e.message);
          setPesertaInfo({
            nama: "Data Error",
            nohp: "-",
            email: "-",
          });
        }
      } catch (err) {
        console.error(err);
        setErrMsg(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id, getOrderKey, getProgressKey, getOptionOrderKey]);

  // =======================================================
  // TIMER COUNTDOWN
  // =======================================================
  useEffect(() => {
    if (sisaDetik === null) return;
    if (sisaDetik === 0) return;

    const t = setInterval(() => {
      setSisaDetik((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(t);
  }, [sisaDetik]);

  const timerDisplay = useMemo(() => {
    if (sisaDetik === null) return "--:--";
    const h = Math.floor(sisaDetik / 3600);
    const m = Math.floor((sisaDetik % 3600) / 60);
    const s = sisaDetik % 60;
    return h > 0
      ? `${pad2(h)}:${pad2(m)}:${pad2(s)}`
      : `${pad2(m)}:${pad2(s)}`;
  }, [sisaDetik]);

  // =======================================================
  // AUTO-SAVE PROGRESS
  // =======================================================
  useEffect(() => {
    if (loading || soalList.length === 0 || sisaDetik === null) return;
    const progressKey = getProgressKey();
    const savedProgress =
      JSON.parse(localStorage.getItem(progressKey)) || {};
    const progressData = {
      ...savedProgress,
      jawabanUser,
      raguRagu,
      lastUpdated: new Date().toISOString(),
    };
    try {
      localStorage.setItem(progressKey, JSON.stringify(progressData));
    } catch (e) {
      console.warn("Gagal menyimpan progress ke localStorage:", e);
    }
  }, [
    jawabanUser,
    raguRagu,
    loading,
    soalList.length,
    getProgressKey,
    sisaDetik,
  ]);

  // =======================================================
  // AUTO-SAVE DRAFT ke BACKEND
  // =======================================================
  const saveDraftToServer = useCallback(async () => {
    try {
      if (isSubmitting) return;
      const peserta = JSON.parse(localStorage.getItem("pesertaData"));
      if (!peserta?.id || soalList.length === 0) return;

      const jawabanArray = soalList.map((soal) => ({
        question_id: soal.id,
        tipe_soal: soal.tipeSoal,
        jawaban_text: jawabanUser[soal.id] || null,
      }));

      await fetch(`${API_URL}/api/hasil/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          peserta_id: peserta.id,
          exam_id: id,
          jawaban: jawabanArray,
        }),
        keepalive: true,
      });
    } catch (e) {
      console.warn("Autosave draft gagal:", e.message);
    }
  }, [id, soalList, jawabanUser, isSubmitting]);

  useEffect(() => {
    if (loading || soalList.length === 0 || sisaDetik === null) return;
    const iv = setInterval(saveDraftToServer, 15000);
    return () => clearInterval(iv);
  }, [saveDraftToServer, loading, soalList.length, sisaDetik]);

  useEffect(() => {
    if (loading || soalList.length === 0) return;

    const sendDraftBeacon = () => {
      try {
        if (isSubmitting) return;
        const peserta = JSON.parse(localStorage.getItem("pesertaData"));
        if (!peserta?.id) return;

        const jawabanArray = soalList.map((soal) => ({
          question_id: soal.id,
          tipe_soal: soal.tipeSoal,
          jawaban_text: jawabanUser[soal.id] || null,
        }));

        const payload = {
          peserta_id: peserta.id,
          exam_id: id,
          jawaban: jawabanArray,
        };

        const url = `${API_URL}/api/hasil/draft`;

        if (navigator.sendBeacon) {
          const blob = new Blob([JSON.stringify(payload)], {
            type: "application/json",
          });
          navigator.sendBeacon(url, blob);
        } else {
          fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            keepalive: true,
          });
        }
      } catch (e) {
        console.warn("Beacon draft gagal:", e.message);
      }
    };

    const onPageHide = () => sendDraftBeacon();
    const onBeforeUnload = () => sendDraftBeacon();
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") sendDraftBeacon();
    };

    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [loading, soalList, jawabanUser, id, isSubmitting]);

  // =======================================================
  // HANDLER JAWABAN
  // =======================================================
  const handleJawabPilihan = (pilihanId) => {
    const soalId = soalList[currentIndex]?.id;
    if (!soalId) return;
    setJawabanUser((prev) => ({ ...prev, [soalId]: pilihanId }));
  };

  const handleJawabEsai = (text) => {
    const soalId = soalList[currentIndex]?.id;
    if (!soalId) return;
    setJawabanUser((prev) => ({ ...prev, [soalId]: text }));
  };

  const formatSize = (bytes = 0) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // --- UPDATE: Validasi File Upload (Size, Count, Type) & UPLOAD LANGSUNG ---
  const handleTambahDokumen = async (incoming) => {
    const soal = soalList[currentIndex];
    if (!soal || !soal.id) return;
    
    // Ambil Config dengan Parsing yang Aman
    const config = soal.fileConfig || {};
    const maxCount = parseInt(config.maxCount) || 1; // Pastikan Integer
    const maxSizeMB = parseFloat(config.maxSize) || 5; // Pastikan Float/Number
    const allowedTypes = Array.isArray(config.allowedTypes) ? config.allowedTypes : [];

    const existingFiles = dokumenFiles[soal.id] || [];
    const incomingFiles = Array.from(incoming || []).filter(Boolean);

    if (incomingFiles.length === 0) return;

    // 1. Validasi Jumlah File Total
    if (existingFiles.length + incomingFiles.length > maxCount) {
      // 🔔 MODIFIKASI: Gunakan showNotification bukan alert
      showNotification(`Maksimal hanya ${maxCount} file. Anda sudah punya ${existingFiles.length}.`, 'error');
      return;
    }

    const filesToUpload = [];

    // Validasi per file
    for (const file of incomingFiles) {
        // 2. Validasi Ukuran File
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > maxSizeMB) {
            // 🔔 MODIFIKASI: Gunakan showNotification, format pesan lebih rapi
            showNotification(
               `Gagal: "${file.name}" (${fileSizeMB.toFixed(2)} MB) melebihi batas ${maxSizeMB} MB.`,
               'error'
            );
            continue;
        }

        // 3. Validasi Tipe File (Ekstensi)
        if (allowedTypes.length > 0) {
            const parts = file.name.split('.');
            const ext = parts.length > 1 ? '.' + parts.pop().toLowerCase() : '';
            
            // Logic split yang kuat
            let normalizedAllowedTypes = [];
            allowedTypes.forEach(typeStr => {
                if (typeof typeStr === 'string' && typeStr.includes(',')) {
                    normalizedAllowedTypes.push(...typeStr.split(',').map(s => s.trim().toLowerCase()));
                } else if (typeof typeStr === 'string') {
                    normalizedAllowedTypes.push(typeStr.trim().toLowerCase());
                }
            });

            const isAllowed = normalizedAllowedTypes.includes(ext);
            if (!isAllowed) {
                // 🔔 MODIFIKASI: Gunakan showNotification
                showNotification(`Gagal: "${file.name}" format tidak diizinkan.`, 'error');
                continue;
            }
        }
        
        // Tambahkan ke antrian upload
        filesToUpload.push(file);
    }

    if (filesToUpload.length === 0) return;

    // 🚀 PROSES UPLOAD LANGSUNG KE BACKEND
    // Kita upload satu per satu (atau bisa bulk jika backend support)
    const uploadedResults = [];

    for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append("file", file);

        try {
            // Kita asumsikan ada loading indikator sederhana (optional)
            const res = await fetch(`${API_URL}/api/ujian/upload-peserta`, {
                method: "POST",
                body: formData
            });
            const data = await res.json();

            if (res.ok) {
                uploadedResults.push({
                    name: data.originalName,
                    path: data.filePath, // Path dari server (misal: /uploads_jawaban/xxx.pdf)
                    uploaded: true
                });
                // 🔔 Opsi: Beri notifikasi sukses kecil (opsional)
                // showNotification(`Berhasil upload ${data.originalName}`, 'success');
            } else {
                 showNotification(`Gagal upload ${file.name}: ${data.message}`, 'error');
            }
        } catch (err) {
            console.error("Error uploading file:", err);
            showNotification(`Terjadi kesalahan saat mengupload ${file.name}`, 'error');
        }
    }

    // UPDATE STATE & JAWABAN USER
    if (uploadedResults.length > 0) {
        const merged = [...existingFiles, ...uploadedResults];
        
        // 1. Update State Visual (Dokumen Files)
        setDokumenFiles((prev) => ({ ...prev, [soal.id]: merged }));
        
        // 2. Update Jawaban User (JSON String Path) -> Ini yang masuk LocalStorage & Database Draft
        // Kita hanya simpan array path-nya saja
        const pathsOnly = merged.map(f => f.path);
        setJawabanUser((prev) => ({
            ...prev,
            [soal.id]: JSON.stringify(pathsOnly), // Simpan sebagai string JSON
        }));
        
        // Notifikasi sukses global
        showNotification(`${uploadedResults.length} file berhasil diunggah`, 'success');
    }
  };
  // --------------------------------------------------------

  const handleHapusDokumen = (soalId, index) => {
    setDokumenFiles((prev) => {
      const list = prev[soalId] || [];
      const newList = list.filter((_, i) => i !== index);

      // Update juga jawabanUser agar sinkron
      const pathsOnly = newList.map(f => f.path);
      setJawabanUser((jPrev) => ({
        ...jPrev,
        [soalId]: JSON.stringify(pathsOnly),
      }));

      return { ...prev, [soalId]: newList };
    });
  };

  const handleHapusSemuaDokumen = (soalId) => {
    setDokumenFiles((prev) => ({ ...prev, [soalId]: [] }));
    setJawabanUser((prev) => ({ ...prev, [soalId]: "" }));
  };

  const toggleRagu = () => {
    const soalId = soalList[currentIndex]?.id;
    if (!soalId) return;
    setRaguRagu((prev) => ({ ...prev, [soalId]: !prev[soalId] }));
  };

  const handleBatalJawab = () => {
    const soalId = soalList[currentIndex]?.id;
    if (!soalId) return;

    setJawabanUser((prev) => ({ ...prev, [soalId]: "" }));
    setDokumenFiles((prev) => ({ ...prev, [soalId]: [] }));
  };

  const gotoPrev = () => {
    setCurrentIndex((idx) => (idx > 0 ? idx - 1 : idx));
  };

  const gotoNext = () => {
    setCurrentIndex((idx) =>
      idx < soalList.length - 1 ? idx + 1 : idx
    );
  };

  const gotoNomor = (idx) => setCurrentIndex(idx);

  // =======================================================
  // SUBMIT FINAL
  // =======================================================
  const handleSubmit = useCallback(
    async (isAutoSubmit = false) => {
      if (isSubmitting) return;

      const peserta = JSON.parse(localStorage.getItem("pesertaData"));
      if (!peserta || !peserta.id) {
        showNotification("Data peserta tidak ditemukan...", 'error');
        navigate("/");
        return;
      }

      setIsSubmitting(true);

      const jawabanArray = soalList.map((soal) => {
        const jawaban = jawabanUser[soal.id] || null;
        return {
          question_id: soal.id,
          tipe_soal: soal.tipeSoal,
          jawaban_text: jawaban, // Ini sudah berisi JSON string path untuk dokumen
        };
      });

      const payload = {
        peserta_id: peserta.id,
        exam_id: id,
        jawaban: jawabanArray,
      };

      try {
        // Karena file dokumen SUDAH diupload, kita cukup kirim JSON biasa
        // Tidak perlu lagi pakai FormData yang kompleks untuk file
        const res = await fetch(`${API_URL}/api/hasil`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        localStorage.setItem("newHasilUjian", "true");

        const progressKey = getProgressKey();
        const orderKey = getOrderKey();

        try {
          soalList.forEach((soal) => {
            const ok = getOptionOrderKey(soal.id);
            localStorage.removeItem(ok);
          });
        } catch (e) {
          console.warn("Gagal hapus order opsi:", e.message);
        }

        localStorage.removeItem("pesertaData");
        localStorage.removeItem("loginPeserta");
        localStorage.removeItem(progressKey);
        localStorage.removeItem(orderKey);

        if (isAutoSubmit) {
          setIsSubmitting(false);
          countdownIntervalRef.current = setInterval(() => {
            setAutoSubmitCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(countdownIntervalRef.current);
                navigate("/selesai");
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        } else {
          setShowConfirmModal(false);
          navigate("/selesai");
        }
      } catch (err) {
        showNotification("Gagal menyimpan hasil ujian: " + err.message, 'error');
        setIsSubmitting(false);
        setShowConfirmModal(false);
        setShowAutoSubmitModal(false);
      }
    },
    [
      isSubmitting,
      id,
      soalList,
      jawabanUser,
      navigate,
      getProgressKey,
      getOrderKey,
      getOptionOrderKey,
    ]
  );

  useEffect(() => {
    if (loading || sisaDetik === null || isSubmitting) return;

    if (sisaDetik === 0) {
      if (countdownIntervalRef.current === null && !showAutoSubmitModal) {
        console.log("WAKTU HABIS: Auto-submit dipicu.");
        setShowAutoSubmitModal(true);
        handleSubmit(true);
      }
    }
  }, [sisaDetik, isSubmitting, loading, handleSubmit, showAutoSubmitModal]);

  // =======================================================
  // RENDER
  // =======================================================
  if (loading)
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-400 border-t-transparent mx-auto mb-4" />
          <p className="text-sm font-medium tracking-wide">Memuat ujian...</p>
        </div>
      </div>
    );

  if (errMsg)
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-red-50 text-red-600 p-6">
        <p className="text-lg font-semibold mb-2">Gagal memuat ujian</p>
        <p className="text-sm text-red-500">{errMsg}</p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md"
        >
          Kembali ke Halaman Utama
        </button>
      </div>
    );

  const soalAktif = soalList[currentIndex];
  const jumlahTerjawab = soalList.filter((soal) => {
    const soalId = soal.id;

    if (soal.tipeSoal === "soalDokumen") {
      return (dokumenFiles[soalId] || []).length > 0;
    }

    const v = jawabanUser[soalId];
    return v !== "" && v !== null && v !== undefined;
  }).length;


  return (
    <>
      {/* 🔔 CUSTOM NOTIFICATION TOAST */}
      {notification && (
        <div 
          className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[9999] flex items-center gap-3 px-6 py-3.5 rounded-xl shadow-lg border animate-fade-in-down transition-all duration-300 ${
            notification.type === 'error' 
              ? 'bg-white border-red-200 text-red-700' 
              : 'bg-white border-green-200 text-green-700'
          }`}
        >
           {notification.type === 'error' ? (
              <FaExclamationCircle className="text-xl flex-shrink-0 text-red-500" />
           ) : (
              <FaCheckCircle className="text-xl flex-shrink-0 text-green-500" />
           )}
           <div className="flex flex-col">
              <span className={`font-semibold text-sm ${notification.type === 'error' ? 'text-red-800' : 'text-green-800'}`}>
                {notification.type === 'error' ? 'Peringatan' : 'Berhasil'}
              </span>
              <span className="text-sm opacity-90">{notification.message}</span>
           </div>
           <button 
              onClick={() => setNotification(null)}
              className="ml-3 p-1 hover:bg-gray-100 rounded-full transition text-gray-400 hover:text-gray-600"
            >
              <FaTimes />
           </button>
        </div>
      )}

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 bg-gray-50">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Kolom Kiri: Soal */}
          <main className="flex-1 w-full">
            <div className="w-full bg-white rounded-xl border border-gray-200">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between p-5 border-b border-gray-200">
                <div>
                  <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Soal {currentIndex + 1} / {soalList.length}
                  </div>
                  <div className="text-sm font-semibold text-gray-800">
                    {soalAktif?.tipeSoal === "pilihanGanda"
                      ? "Pilihan Ganda"
                      : soalAktif?.tipeSoal === "teksSingkat"
                        ? "Jawaban Singkat"
                        : soalAktif?.tipeSoal === "soalDokumen"
                          ? "Soal Dokumen"
                          : "Esai / Uraian"}
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:items-end">
                  <div className="flex items-center gap-2 text-[12px]">
                    <button
                      onClick={gotoPrev}
                      disabled={currentIndex === 0}
                      className="
                        px-3 py-1.5 rounded-md border text-[12px]
                        bg-blue-600 text-white border-blue-600
                        hover:bg-blue-700 hover:border-blue-700
                        disabled:opacity-40 disabled:cursor-not-allowed
                      "
                    >
                      Kembali
                    </button>

                    <button
                      onClick={gotoNext}
                      disabled={currentIndex === soalList.length - 1}
                      className="
                        px-3 py-1.5 rounded-md border text-[12px]
                        bg-green-600 text-white border-green-600
                        hover:bg-green-700 hover:border-green-700
                        disabled:opacity-40 disabled:cursor-not-allowed
                      "
                    >
                      Lanjut
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Tombol Batal */}
                    {(soalAktif?.tipeSoal === "pilihanGanda" ||
                      soalAktif?.tipeSoal === "soalDokumen") &&
                      jawabanUser[soalAktif.id] && (
                        <button
                          onClick={handleBatalJawab}
                          className="px-3 py-1.5 rounded-md border text-[12px] bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:border-red-300 transition-colors"
                          title="Hapus jawaban terpilih"
                        >
                          Batal
                        </button>
                      )}

                    <button
                      onClick={toggleRagu}
                      className={`text-[12px] px-3 py-1.5 rounded-md border ${raguRagu[soalAktif?.id]
                        ? "bg-yellow-50 border-yellow-400 text-yellow-700"
                        : "bg-white border-orange-300 text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                      {raguRagu[soalAktif?.id]
                        ? "Ditandai ragu-ragu"
                        : "Tandai ragu-ragu"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Isi Soal */}
              <div className="p-5">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/60 border border-blue-200 rounded-lg p-4 text-[15px] leading-relaxed text-gray-800 whitespace-pre-wrap break-words">
                  {soalAktif?.soalText || "(soal kosong)"}
                </div>

                {soalAktif?.gambarUrl && (
                  <div className="mt-5 flex justify-center">
                    <img
                      src={soalAktif.gambarUrl}
                      alt="Gambar Soal"
                      className="max-h-64 rounded-md border border-gray-200 object-contain bg-white p-2"
                    />
                  </div>
                )}

                {/* Pilihan Ganda */}
                {soalAktif?.tipeSoal === "pilihanGanda" && (
                  <div className="mt-6 space-y-3">
                    {soalAktif.pilihan.map((pil, idxPil) => {
                      const jawabanTersimpan = jawabanUser[soalAktif.id];
                      const aktif = jawabanTersimpan === pil.id;
                      const labelHuruf = String.fromCharCode(
                        "A".charCodeAt(0) + idxPil
                      );
                      return (
                        <button
                          key={pil.id}
                          onClick={() => handleJawabPilihan(pil.id)}
                          className={`w-full text-left flex items-start gap-3 rounded-lg border p-4 text-[15px] leading-relaxed transition ${aktif
                            ? "bg-white border-blue-500 ring-2 ring-blue-200"
                            : "bg-white border-gray-300 hover:bg-gray-50 hover:border-blue-300"
                            }`}
                        >
                          <div
                            className={`flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-sm font-semibold ${aktif
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-700 border border-gray-300"
                              }`}
                          >
                            {labelHuruf}
                          </div>
                          <div className="flex-1 text-gray-800 break-words text-left">
                            {pil.text || "(kosong)"}
                          </div>
                          <div
                            className={`text-lg ${aktif ? "text-blue-600" : "text-gray-400"
                              }`}
                          >
                            {aktif ? <FaCheckCircle /> : <FaRegCircle />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Esai / Teks Singkat */}
                {(soalAktif?.tipeSoal === "esai" ||
                soalAktif?.tipeSoal === "esay" ||
                  soalAktif?.tipeSoal === "teksSingkat") && (
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jawaban Anda
                      </label>
                      <textarea
                        className="w-full min-h-[160px] bg-white border border-gray-300 rounded-lg p-4 text-gray-800 text-[15px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400"
                        value={jawabanUser[soalAktif.id] || ""}
                        onChange={(e) => handleJawabEsai(e.target.value)}
                        placeholder="Ketik jawaban Anda di sini..."
                      />
                      {soalAktif?.tipeSoal === "teksSingkat" && (
                        <p className="text-xs text-gray-500 mt-1"></p>
                      )}
                    </div>
                  )}

                {/* --- UPDATE: SOAL DOKUMEN dengan Instruksi Validasi --- */}
                {soalAktif?.tipeSoal === "soalDokumen" && (() => {
                  const soalId = soalAktif.id;
                  const files = dokumenFiles[soalId] || [];

                  // Ambil Config untuk ditampilkan di UI
                  const config = soalAktif.fileConfig || {};
                  const allowedTypes = Array.isArray(config.allowedTypes) ? config.allowedTypes : [];
                  const maxSizeMB = parseFloat(config.maxSize) || 5;
                  const maxCount = parseInt(config.maxCount) || 1;
                  
                  // String untuk input accept
                  const acceptString = allowedTypes.length > 0 ? allowedTypes.join(",") : ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*";

                  const isMaxReached = files.length >= maxCount;

                  const onBrowseClick = () => {
                      if (!isMaxReached) dokumenInputRef.current?.click();
                  };

                  const onDragOver = (e) => {
                    e.preventDefault();
                    if (!isMaxReached) setIsDragOver(true);
                  };
                  const onDragLeave = (e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                  };
                  const onDrop = (e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    if (!isMaxReached) handleTambahDokumen(e.dataTransfer.files);
                  };

                  return (
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Jawaban (Dokumen)
                      </label>

                      {/* Info Validasi */}
                      <div className="bg-blue-50 text-blue-800 text-xs px-3 py-2 rounded mb-3 border border-blue-100 flex flex-col gap-1">
                          <p><strong>Ketentuan File:</strong></p>
                          <ul className="list-disc pl-4 space-y-0.5">
                              <li>Format: {allowedTypes.length > 0 ? allowedTypes.join(", ") : "Semua jenis dokumen"}</li>
                              <li>Ukuran Maksimal: {maxSizeMB} MB per file</li>
                              <li>Jumlah Maksimal: {maxCount} file</li>
                          </ul>
                      </div>

                      {/* Drop Zone */}
                      <div
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        onClick={onBrowseClick}
                        className={`w-full rounded-lg border-2 border-dashed p-6 text-center transition
                          ${isMaxReached 
                            ? "border-gray-200 bg-gray-100 cursor-not-allowed opacity-60" 
                            : isDragOver
                                ? "border-blue-500 bg-blue-50 cursor-pointer"
                                : "border-gray-300 bg-white hover:bg-gray-50 cursor-pointer"
                          }`}
                      >
                        {isMaxReached ? (
                             <p className="text-sm text-gray-500 font-medium">
                                Jumlah file sudah maksimal ({maxCount} file).
                                <br/>Hapus file untuk mengunggah yang baru.
                             </p>
                        ) : (
                            <>
                                <p className="text-sm text-gray-700 font-medium">
                                Drag & drop file di sini, atau klik untuk pilih file
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                Klik untuk mencari file
                                </p>
                            </>
                        )}
                      </div>

                      {/* Hidden input */}
                      <input
                        ref={dokumenInputRef}
                        type="file"
                        multiple={maxCount > 1}
                        accept={acceptString}
                        onChange={(e) => {
                          handleTambahDokumen(e.target.files);
                          e.target.value = null; // reset value
                        }}
                        className="hidden"
                        disabled={isMaxReached}
                      />

                      {/* List file */}
                      {files.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-gray-600">
                              {files.length} / {maxCount} file dipilih
                            </p>
                            <button
                              onClick={() => handleHapusSemuaDokumen(soalId)}
                              className="text-xs text-red-600 hover:underline"
                              type="button"
                            >
                              Hapus semua
                            </button>
                          </div>

                          {files.map((f, idx) => (
                            <div
                              key={`${f.name}-${idx}`}
                              className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md px-3 py-2"
                            >
                              <div className="flex items-center min-w-0 gap-2">
                                <FaFileAlt className="text-blue-500" />
                                <div className="min-w-0">
                                    <a 
                                        href={`${API_URL}${f.path}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:underline truncate block"
                                    >
                                        {f.name}
                                    </a>
                                </div>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleHapusDokumen(soalId, idx);
                                }}
                                className="text-xs ml-2 px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                                type="button"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {files.length === 0 && (
                        <p className="text-xs text-gray-500 mt-2">
                          Belum ada file dipilih.
                        </p>
                      )}
                    </div>
                  );
                })()}

              </div>
            </div>
          </main>

          {/* Kolom Kanan */}
          <aside className="w-full lg:w-72 xl:w-80 space-y-6">
            <InfoPesertaBox peserta={pesertaInfo} />
            <StatusUjianBox
              totalSoal={soalList.length}
              jumlahTerjawab={jumlahTerjawab}
              timerDisplay={timerDisplay}
              soalList={soalList}
              jawabanUser={jawabanUser}
              dokumenFiles={dokumenFiles}
              raguRagu={raguRagu}
              currentIndex={currentIndex}
              onNavClick={gotoNomor}
              onSubmit={() => setShowConfirmModal(true)}
            />
            <InfoUjianBox
              keterangan={keterangan}
              tanggal={displayTanggal}
              jamMulai={displayJamMulai}
              jamBerakhir={displayJamBerakhir}
              durasi={durasiMenit}
              formatTanggal={formatTanggal}
            />
          </aside>
        </div>
      </div>

      {/* MODAL */}
      {showConfirmModal && (
        <SubmitUjianModal
          mode="confirm"
          isSubmitting={isSubmitting}
          onConfirm={() => handleSubmit(false)}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}
      {showAutoSubmitModal && (
        <SubmitUjianModal
          mode="auto_submit"
          isSubmitting={isSubmitting}
          countdown={autoSubmitCountdown}
        />
      )}
    </>
  );
};

export default PartSoal;