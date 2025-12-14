// File: src/admin/TemplateExcel.jsx
import * as XLSX from "xlsx";

// ==========================================
// 1. DEFINISI TIPE FILE SESUAI TAMBAHSOAL.JSX
// ==========================================
// Daftar ini disamakan persis dengan FILE_TYPE_GROUPS di TambahSoal.jsx
const ALL_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".jpg",
  ".jpeg",
  ".png",
  ".zip",
  ".rar",
];

// ==========================================
// 2. PRIVATE HELPERS (Internal Utility)
// ==========================================

const pad2 = (n) => String(n).padStart(2, "0");

const excelDateToISO = (val) => {
  if (!val) return "";
  if (val instanceof Date && !isNaN(val)) {
    return val.toISOString().slice(0, 10);
  }
  if (typeof val === "number") {
    const d = XLSX.SSF.parse_date_code(val);
    if (d && d.y && d.m && d.d) {
      return `${d.y}-${pad2(d.m)}-${pad2(d.d)}`;
    }
  }
  const s = String(val).trim();
  // Format DD/MM/YYYY
  const m1 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m1) {
    const [_, dd, mm, yyyy] = m1;
    return `${yyyy}-${pad2(mm)}-${pad2(dd)}`;
  }
  // Format YYYY-MM-DD
  const m2 = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m2) {
    const [_, yyyy, mm, dd] = m2;
    return `${yyyy}-${pad2(mm)}-${pad2(dd)}`;
  }
  return s;
};

const excelTimeToHHMM = (val) => {
  if (!val) return "";
  if (typeof val === "number") {
    const totalMinutes = Math.round(val * 24 * 60);
    const hh = Math.floor(totalMinutes / 60);
    const mm = totalMinutes % 60;
    return `${pad2(hh)}:${pad2(mm)}`;
  }
  const s = String(val).trim();
  // Match HH:MM or H:MM
  const m = s.match(/^(\d{1,2})[:.](\d{1,2})/);
  if (m) return `${pad2(m[1])}:${pad2(m[2])}`;
  return s;
};

const excelBoolToJS = (val) => {
  const v = String(val || "").trim().toLowerCase();
  if (["true", "1", "ya", "yes", "y"].includes(v)) return true;
  return false;
};

// Normalisasi Tipe Soal agar Import tidak lari ke Pilihan Ganda
const normalizeTipe = (raw) => {
  const v = String(raw || "").trim().toLowerCase();
  if (!v) return "pilihanGanda"; // Default

  // Variasi Pilihan Ganda
  if (
    [
      "pg",
      "pilihanganda",
      "pilihan ganda",
      "pilihan_ganda",
      "multiple choice",
      "multiplechoice",
    ].includes(v)
  )
    return "pilihanGanda";

  // Variasi Teks Singkat
  if (
    [
      "teks",
      "singkat",
      "teks singkat",
      "teks_singkat",
      "tekssingkat",
      "short answer",
      "shortanswer",
      "isian",
      "jawaban singkat",
    ].includes(v)
  )
    return "teksSingkat";

  // Variasi Esai
  if (["esai", "essay", "esay", "uraian", "penjelasan"].includes(v))
    return "esai";

  // Variasi Soal Dokumen
  if (
    [
      "dokumen",
      "soal dokumen",
      "soal_dokumen",
      "soaldokumen",
      "upload",
      "file",
      "upload file",
    ].includes(v)
  )
    return "soalDokumen";

  return "pilihanGanda";
};

// Helper untuk parsing kunci jawaban PG (Angka/Huruf -> Index 1-5)
const parseKunciPG = (rawKunci, pilihanTexts) => {
  const v = String(rawKunci || "").trim();
  if (!v) return 1;

  // Cek jika input adalah angka (1, 2, 3...)
  const num = parseInt(v, 10);
  if (!Number.isNaN(num)) {
      // Pastikan index valid sesuai jumlah pilihan
      if (num >= 1 && num <= Math.max(pilihanTexts.length, 5)) return num;
  }

  // Cek jika huruf (A, B, C...)
  const letterMap = { A: 1, B: 2, C: 3, D: 4, E: 5, a: 1, b: 2, c: 3, d: 4, e: 5 };
  if (letterMap[v]) return letterMap[v];

  // Cek jika teks jawaban langsung ditulis di kolom kunci
  const idx = pilihanTexts.findIndex(
    (p) => String(p).trim().toLowerCase() === v.toLowerCase()
  );
  if (idx !== -1) return idx + 1;

  return 1; // Default ke pilihan 1 jika gagal parse
};

// --- [FIX BUG 1] Helper Baru: Membersihkan List File ---
// Fungsi ini memecah string yang tergabung (misal ".doc, .docx")
// dan menghapus duplikat agar hasil export Excel rapi.
const cleanAndFormatAllowedTypes = (typesArray) => {
  if (!Array.isArray(typesArray) || typesArray.length === 0) return "";
  
  const flatList = [];
  
  // 1. Flatten & Split: Jika ada item yg tergabung
  typesArray.forEach(item => {
     const sItem = String(item);
     if (sItem.includes(',')) {
        const splits = sItem.split(',').map(s => s.trim());
        flatList.push(...splits);
     } else {
        flatList.push(sItem.trim());
     }
  });

  // 2. Filter & Unique: Hanya ambil yg valid dan buang duplikat
  const uniqueTypes = [...new Set(
    flatList
      .map(t => t.toLowerCase())
      .filter(t => ALL_EXTENSIONS.includes(t))
  )];

  // 3. Gabung string dengan spasi yang rapi
  return uniqueTypes.join(", ");
};

// ==========================================
// 3. EXPORTED FUNCTIONS (Public API)
// ==========================================

export const downloadWorkbook = (wb, filename = "template_soal.xlsx") => {
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/octet-stream" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const buildTemplateWorkbook = () => {
  // --- Sheet TEMPLATE_SOAL ---
  const soalHeaders = [
    "tipeSoal",
    "bobot",
    "soalText",
    "pilihan1",
    "pilihan2",
    "pilihan3",
    "pilihan4",
    "pilihan5",
    "kunciJawaban",
    "gambarUrl",
    "allowedTypes",
    "maxSize",
    "maxCount",
  ];

  // Contoh data dummy untuk template
  const contohSoal = [
    {
      tipeSoal: "pilihanGanda",
      bobot: 1,
      soalText: "Ibu kota Indonesia saat ini adalah...",
      pilihan1: "Jakarta",
      pilihan2: "Bandung",
      pilihan3: "Surabaya",
      pilihan4: "Medan",
      pilihan5: "",
      kunciJawaban: "A",
      gambarUrl: "",
      allowedTypes: "",
      maxSize: "",
      maxCount: "",
    },
    {
      tipeSoal: "teksSingkat",
      bobot: 2,
      soalText: "Siapakah presiden pertama RI?",
      pilihan1: "",
      pilihan2: "",
      pilihan3: "",
      pilihan4: "",
      pilihan5: "",
      kunciJawaban: "Soekarno, Bung Karno",
      gambarUrl: "",
      allowedTypes: "",
      maxSize: "",
      maxCount: "",
    },
    {
      tipeSoal: "esai",
      bobot: 5,
      soalText: "Jelaskan proses terjadinya hujan!",
      pilihan1: "",
      pilihan2: "",
      pilihan3: "",
      pilihan4: "",
      pilihan5: "",
      kunciJawaban: "",
      gambarUrl: "",
      allowedTypes: "",
      maxSize: "",
      maxCount: "",
    },
    {
      tipeSoal: "soalDokumen",
      bobot: 10,
      soalText: "Upload bukti pendukung (Bisa PDF atau Word).",
      pilihan1: "",
      pilihan2: "",
      pilihan3: "",
      pilihan4: "",
      pilihan5: "",
      kunciJawaban: "",
      gambarUrl: "",
      allowedTypes: ".pdf, .doc, .docx",
      maxSize: 10,
      maxCount: 1,
    },
  ];

  const wsSoal = XLSX.utils.json_to_sheet(contohSoal, { header: soalHeaders });
  // Set lebar kolom agar rapi
  wsSoal["!cols"] = [
      { wch: 15 }, { wch: 5 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, 
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 },
      { wch: 20 }, { wch: 8 }, { wch: 8 }
  ];

  // --- Sheet PENGATURAN_UJIAN ---
  const settingHeaders = [
    "keterangan",
    "tanggalMulai",
    "tanggalBerakhir",
    "jamMulai",
    "jamBerakhir",
    "durasiMenit",
    "acakSoal",
    "acakOpsi",
  ];

  const contohSetting = [
    {
      keterangan: "Ujian Akhir Semester",
      tanggalMulai: "2025-06-01",
      tanggalBerakhir: "2025-06-01",
      jamMulai: "08:00",
      jamBerakhir: "10:00",
      durasiMenit: "120",
      acakSoal: "TRUE",
      acakOpsi: "TRUE",
    },
  ];

  const wsSetting = XLSX.utils.json_to_sheet(contohSetting, {
    header: settingHeaders,
  });
  XLSX.utils.sheet_add_aoa(wsSetting, [settingHeaders], { origin: "A1" });

  // --- Sheet PETUNJUK (TETAP LENGKAP) ---
  const petunjuk = [
    ["PETUNJUK PENGISIAN TEMPLATE EXCEL"],
    [""],
    ["A. SHEET 'PENGATURAN_UJIAN' (Wajib diisi 1 baris)"],
    ["   1. Tanggal format: YYYY-MM-DD (Contoh: 2025-06-01)"],
    ["   2. Jam format: HH:MM (Contoh: 08:00)"],
    ["   3. acakSoal & acakOpsi: Isi dengan TRUE atau FALSE"],
    [""],
    ["B. SHEET 'TEMPLATE_SOAL' - KOLOM UMUM (Wajib untuk semua tipe)"],
    ["   1. tipeSoal: Isi salah satu kode berikut:"],
    ["      - pilihanGanda"],
    ["      - teksSingkat"],
    ["      - esai"],
    ["      - soalDokumen"],
    ["   2. bobot: Angka nilai soal (Contoh: 5). Default adalah 1."],
    ["   3. soalText: Tulisan pertanyaan."],
    ["   4. gambarUrl: Link gambar jika ada (biarkan kosong jika tidak ada)."],
    [""],
    ["C. PETUNJUK KHUSUS PER TIPE SOAL"],
    ["   1. JIKA TIPE 'pilihanGanda' :"],
    ["      - Wajib isi kolom: pilihan1, pilihan2, (opsional s.d pilihan5)."],
    ["      - Wajib isi kolom: kunciJawaban (Isi A, B, C, D, E atau 1, 2, 3, 4, 5)."],
    ["      - Kolom allowedTypes, maxSize, maxCount : KOSONGKAN."],
    [""],
    ["   2. JIKA TIPE 'teksSingkat' :"],
    ["      - Wajib isi kolom: kunciJawaban (Tulis jawaban benarnya)."],
    ["      - Kolom pilihan1-pilihan5 : KOSONGKAN."],
    ["      - Kolom allowedTypes, maxSize, maxCount : KOSONGKAN."],
    [""],
    ["   3. JIKA TIPE 'esai' :"],
    ["      - kunciJawaban : Boleh dikosongkan (karena dikoreksi manual)."],
    ["      - Kolom pilihan1-pilihan5 : KOSONGKAN."],
    ["      - Kolom allowedTypes, maxSize, maxCount : KOSONGKAN."],
    [""],
    ["   4. JIKA TIPE 'soalDokumen' (Siswa diminta upload file) :"],
    ["      - Wajib isi kolom: allowedTypes (Tipe file yang diizinkan, pisah koma)."],
    ["        Daftar Tipe: " + ALL_EXTENSIONS.join(", ")],
    ["      - Wajib isi kolom: maxSize (Ukuran file maks dalam MB, contoh: 5)."],
    ["      - Wajib isi kolom: maxCount (Jumlah file maks, contoh: 1)."],
    ["      - Kolom pilihan1-pilihan5 & kunciJawaban : KOSONGKAN."],
  ];

  const wsPetunjuk = XLSX.utils.aoa_to_sheet(petunjuk);
  wsPetunjuk["!cols"] = [{ wch: 100 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsSetting, "PENGATURAN_UJIAN");
  XLSX.utils.book_append_sheet(wb, wsSoal, "TEMPLATE_SOAL");
  XLSX.utils.book_append_sheet(wb, wsPetunjuk, "PETUNJUK");

  return wb;
};

// =========================================================
// 4. GENERATE WORKBOOK (EXPORT DATA)
// =========================================================
export const generateWorkbookFromState = (data) => {
  const {
    keterangan,
    tanggal,
    tanggalBerakhir,
    jamMulai,
    jamBerakhir,
    durasi,
    acakSoal,
    acakOpsi,
    daftarSoal,
  } = data;

  const settingHeaders = [
    "keterangan",
    "tanggalMulai",
    "tanggalBerakhir",
    "jamMulai",
    "jamBerakhir",
    "durasiMenit",
    "acakSoal",
    "acakOpsi",
  ];

  const settingRow = [
    {
      keterangan: keterangan || "",
      tanggalMulai: tanggal || "",
      tanggalBerakhir: tanggalBerakhir || "",
      jamMulai: jamMulai || "",
      jamBerakhir: jamBerakhir || "",
      durasiMenit: durasi || "",
      acakSoal: acakSoal ? "TRUE" : "FALSE",
      acakOpsi: acakOpsi ? "TRUE" : "FALSE",
    },
  ];

  const wsSetting = XLSX.utils.json_to_sheet(settingRow, {
    header: settingHeaders,
  });
  XLSX.utils.sheet_add_aoa(wsSetting, [settingHeaders], { origin: "A1" });

  const soalHeaders = [
    "tipeSoal",
    "bobot",
    "soalText",
    "pilihan1",
    "pilihan2",
    "pilihan3",
    "pilihan4",
    "pilihan5",
    "kunciJawaban",
    "gambarUrl",
    "allowedTypes",
    "maxSize",
    "maxCount",
  ];

  const soalRows = daftarSoal.map((s) => {
    // Pilihan Ganda Text
    const pilihanTexts =
      s.tipeSoal === "pilihanGanda" && Array.isArray(s.pilihan)
        ? s.pilihan.map((p) => p.text)
        : [];

    // B. Kunci Jawaban Export Logic
    let kunciExport = "";
    if (s.tipeSoal === "pilihanGanda") {
      if (Array.isArray(s.pilihan)) {
        const idx = s.pilihan.findIndex((p) => p.id === s.kunciJawaban);
        if (idx !== -1) {
          kunciExport = String(idx + 1);
        }
      }
    } else if (s.tipeSoal === "teksSingkat") {
      kunciExport = s.kunciJawabanText || "";
    }
    
    // --- [FIX BUG 1] Export Tipe File ---
    // Menggunakan fungsi cleanAndFormatAllowedTypes agar tidak double
    let typesString = "";
    if (s.tipeSoal === "soalDokumen" && Array.isArray(s.allowedTypes)) {
       typesString = cleanAndFormatAllowedTypes(s.allowedTypes);
    }

    return {
      tipeSoal: s.tipeSoal,
      bobot: parseInt(s.bobot, 10) || 1,
      soalText: s.soalText || "",
      pilihan1: pilihanTexts[0] || "",
      pilihan2: pilihanTexts[1] || "",
      pilihan3: pilihanTexts[2] || "",
      pilihan4: pilihanTexts[3] || "",
      pilihan5: pilihanTexts[4] || "",
      kunciJawaban: kunciExport,
      gambarUrl: s.gambarPreview && !s.gambar ? s.gambarPreview : "",
      allowedTypes: typesString,
      maxSize: s.maxSize || "",
      maxCount: s.maxCount || "",
    };
  });

  const wsSoal = XLSX.utils.json_to_sheet(soalRows, { header: soalHeaders });
  XLSX.utils.sheet_add_aoa(wsSoal, [soalHeaders], { origin: "A1" });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsSetting, "PENGATURAN_UJIAN");
  XLSX.utils.book_append_sheet(wb, wsSoal, "TEMPLATE_SOAL");

  return wb;
};

// =========================================================
// 5. PARSE WORKBOOK (IMPORT DATA)
// =========================================================
export const parseWorkbookToState = async (file) => {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });

  const result = {
    settings: null,
    soalList: [],
    errors: [], // Array untuk menampung pesan kesalahan spesifik
  };

  // --- A. Import Pengaturan (Logic tetap sama, sedikit validasi tambahan) ---
  const settingSheetName =
    wb.SheetNames.find((n) => n.toLowerCase() === "pengaturan_ujian") ||
    wb.SheetNames[0];

  if (settingSheetName) {
    const wsSetting = wb.Sheets[settingSheetName];
    const settingJson = XLSX.utils.sheet_to_json(wsSetting, {
      defval: "",
      raw: false,
    });

    if (settingJson.length > 0) {
      const s0 = settingJson[0] || {};
      const norm = Object.fromEntries(
        Object.entries(s0).map(([k, v]) => [String(k).trim().toLowerCase(), v])
      );

      // Validasi Dasar Pengaturan
      if (!norm["tanggalmulai"] && !norm["tanggal_mulai"]) {
        result.errors.push({
           sheet: "PENGATURAN_UJIAN",
           row: 1,
           msg: "Tanggal Mulai tidak ditemukan atau kosong."
        });
      }

      if (norm["tanggalmulai"] || norm["tanggal_mulai"] || norm["keterangan"]) {
        result.settings = {
          keterangan: String(norm["keterangan"] || ""),
          tanggal: excelDateToISO(norm["tanggalmulai"] || norm["tanggal_mulai"]),
          tanggalBerakhir: excelDateToISO(norm["tanggalberakhir"] || norm["tanggal_berakhir"]),
          jamMulai: excelTimeToHHMM(norm["jammulai"] || norm["jam_mulai"]),
          jamBerakhir: excelTimeToHHMM(norm["jamberakhir"] || norm["jam_berakhir"]),
          durasi: String(norm["durasimenit"] || norm["durasi"] || ""),
          acakSoal: excelBoolToJS(norm["acaksoal"]),
          acakOpsi: excelBoolToJS(norm["acakopsi"]),
        };
      }
    }
  }

  // --- B. Import Soal (SMART VALIDATION) ---
  let soalSheetName = wb.SheetNames.find((n) =>
    ["template_soal", "soal", "daftar_soal"].includes(n.toLowerCase())
  );

  if (!soalSheetName && wb.SheetNames.length > 1) {
    soalSheetName = wb.SheetNames[1];
  } else if (!soalSheetName) {
    soalSheetName = wb.SheetNames[0];
  }

  const wsSoal = wb.Sheets[soalSheetName];
  // Gunakan range untuk mendapatkan nomor baris asli Excel
  const range = XLSX.utils.decode_range(wsSoal["!ref"]);
  const json = XLSX.utils.sheet_to_json(wsSoal, { defval: "" });

  let idCounter = Date.now();
  const importedSoal = [];

  // Loop dengan index untuk tracking baris error
  json.forEach((row, index) => {
    // Baris di Excel = Header (1) + Index (0-based) + 2 (Start Data)
    const excelRowParams = index + 2; 

    const lowerRow = Object.fromEntries(
      Object.entries(row).map(([k, v]) => [String(k).trim().toLowerCase(), v])
    );

    // Skip baris kosong atau baris sisa header pengaturan
    if (lowerRow["tanggalmulai"] || lowerRow["tanggal_mulai"]) return;

    // 1. Cek Soal Text
    const soalText =
      lowerRow["soaltext"] ||
      lowerRow["soal_text"] ||
      lowerRow["pertanyaan"] ||
      lowerRow["soal"] ||
      "";

    if (!String(soalText).trim()) {
      // Jika soal kosong, kita anggap baris ini skip, tapi jika ada data lain, kita warn.
      const hasOtherData = Object.values(lowerRow).some(val => String(val).trim() !== "");
      if (hasOtherData) {
        result.errors.push({
           sheet: "TEMPLATE_SOAL",
           row: excelRowParams,
           msg: "Kolom 'soalText' kosong. Baris dilewati."
        });
      }
      return; 
    }

    // 2. Normalisasi & Validasi Tipe Soal
    const rawTipe = lowerRow["tipesoal"] || lowerRow["tipe_soal"] || lowerRow["jenis"];
    const tipeSoal = normalizeTipe(rawTipe);
    
    // Jika user mengisi tipe tapi typo parah (misal: "pil gan"), normalizeTipe akan default ke PG.
    // Kita bisa tambahkan cek warning jika rawTipe ada tapi tidak standard, 
    // tapi untuk sekarang kita anggap fallback normalizeTipe sudah cukup.

    const rawBobot = lowerRow["bobot"] || lowerRow["nilai"] || 1;
    const bobot = parseInt(rawBobot, 10) || 1;
    const gambarUrl = lowerRow["gambarurl"] || lowerRow["gambar_url"] || "";

    // 3. Validasi Per Tipe Soal
    const pilihanTexts = [];
    let isValid = true;

    // --- LOGIC PILIHAN GANDA ---
    if (tipeSoal === "pilihanGanda") {
      for (let i = 1; i <= 5; i++) {
        const val = lowerRow[`pilihan${i}`] || lowerRow[`opsi${i}`] || "";
        if (String(val).trim()) pilihanTexts.push(String(val));
      }

      // ERROR: Opsi kurang dari 2
      if (pilihanTexts.length < 2) {
        result.errors.push({
           sheet: "TEMPLATE_SOAL",
           row: excelRowParams,
           msg: `Soal Pilihan Ganda harus memiliki minimal 2 opsi jawaban (Terdeteksi: ${pilihanTexts.length}).`
        });
        isValid = false;
      }
    } else {
        // Dummy data agar array state tidak error
        pilihanTexts.push("", ""); 
    }

    const kunciRaw = lowerRow["kuncijawaban"] || lowerRow["kunci_jawaban"] || lowerRow["jawaban"] || "";
    let finalKunciPG = null;
    let finalKunciText = "";

    if (isValid) {
        if (tipeSoal === "pilihanGanda") {
            // ERROR: Tidak ada kunci jawaban
            if (!String(kunciRaw).trim()) {
                result.errors.push({
                    sheet: "TEMPLATE_SOAL",
                    row: excelRowParams,
                    msg: "Kunci Jawaban Pilihan Ganda kosong."
                });
                isValid = false;
            } else {
                // Parsing Kunci
                finalKunciPG = parseKunciPG(kunciRaw, pilihanTexts);
                
                // ERROR SMART: Kunci jawaban di luar range (misal jawab 5 padahal opsi cuma 3)
                if (finalKunciPG > pilihanTexts.length) {
                     result.errors.push({
                        sheet: "TEMPLATE_SOAL",
                        row: excelRowParams,
                        msg: `Kunci Jawaban '${kunciRaw}' tidak valid. Opsi hanya ada ${pilihanTexts.length}, tetapi kunci mengarah ke urutan ${finalKunciPG}.`
                    });
                    // Fallback ke 1 agar tidak crash, tapi tetap log error
                    finalKunciPG = 1; 
                    // Kita bisa set isValid = false jika ingin strict reject
                }
            }
        } else if (tipeSoal === "teksSingkat") {
            finalKunciText = String(kunciRaw);
            if (!finalKunciText.trim()) {
                 result.errors.push({
                    sheet: "TEMPLATE_SOAL",
                    row: excelRowParams,
                    msg: "Soal Teks Singkat sebaiknya memiliki Kunci Jawaban (bisa dikosongkan jika manual koreksi, tapi diperingatkan)."
                });
                // Warning saja, tetap valid
            }
        }
    }

    // --- LOGIC DOKUMEN ---
    let allowedTypes = [];
    let maxSize = 5;
    let maxCount = 1;

    if (tipeSoal === "soalDokumen") {
      const rawTypes = lowerRow["allowedtypes"] || lowerRow["tipe_file"] || "";
      
      if (!String(rawTypes).trim()) {
           // Warning: Defaulting to all types
           // Tidak error fatal
      } else {
          allowedTypes = String(rawTypes)
          .split(",")
          .map((t) => {
            let clean = t.trim().toLowerCase();
            if (clean && !clean.startsWith(".")) clean = "." + clean;
            return clean;
          })
          .filter((t) => ALL_EXTENSIONS.includes(t));
      }

      maxSize = parseInt(lowerRow["maxsize"] || 5, 10);
      maxCount = parseInt(lowerRow["maxcount"] || 1, 10);
    }

    // Jika Lolos Validasi Kritis, Masukkan ke List
    if (isValid) {
        importedSoal.push({
          id: idCounter++,
          tipeSoal,
          bobot,
          soalText: String(soalText),
          gambar: null,
          gambarPreview: String(gambarUrl).trim() || null,
          pilihan: pilihanTexts.map((t, idx) => ({ id: idx + 1, text: t })),
          kunciJawaban: finalKunciPG,
          kunciJawabanText: finalKunciText,
          allowedTypes,
          maxSize,
          maxCount,
        });
    }
  });

  result.soalList = importedSoal;
  return result;
};