// File: src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import './index.css';

// --- GLOBAL FETCH INTERCEPTOR ---
// Simpan fungsi fetch asli browser agar tidak hilang
const originalFetch = window.fetch;

// Timpa fungsi fetch browser dengan versi modifikasi kita
window.fetch = async (...args) => {
  // 1. Lakukan request seperti biasa menggunakan fetch asli
  const response = await originalFetch(...args);

  // -----------------------------------------------------------
  // FITUR 1: SLIDING EXPIRATION (Perpanjang Sesi Otomatis)
  // -----------------------------------------------------------
  // Cek apakah backend mengirim token baru di header respon
  const newToken = response.headers.get("x-new-token");
  
  if (newToken) {
    console.log("🔄 Sesi diperpanjang otomatis (Sliding Expiration)");
    // Update token di session storage tanpa mengganggu user
    sessionStorage.setItem("adminToken", newToken);
  }

  // -----------------------------------------------------------
  // FITUR 2: AUTO KICK (Deteksi Akun Dinonaktifkan)
  // -----------------------------------------------------------
  // Jika server menolak akses dengan status 403 (Forbidden)
  if (response.status === 403) {
    try {
      // Clone response karena body stream hanya bisa dibaca sekali.
      // Kita baca di sini untuk cek pesan error, tapi aplikasi utama
      // mungkin butuh membacanya lagi nanti.
      const clonedRes = response.clone();
      const data = await clonedRes.json();
      
      // Cek pesan error spesifik yang dikirim oleh verifyAdmin.js
      // Pastikan pesan ini SAMA PERSIS dengan yang ada di backend
      if (data.message === "Akun Anda telah dinonaktifkan.") {
        console.warn("🚫 TRIGGER: Akun nonaktif terdeteksi. Memulai protokol logout...");
        
        // Kirim sinyal event khusus ke window
        // Component NotifNonaktif.jsx akan menangkap sinyal ini dan memunculkan popup
        window.dispatchEvent(new Event("ADMIN_DEACTIVATED"));
      }
    } catch (e) {
      // Abaikan jika respons bukan JSON valid (bukan error dari API kita)
    }
  }

  // 4. Kembalikan response asli ke komponen yang memanggil fetch
  return response;
};

// Render Aplikasi Utama
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);