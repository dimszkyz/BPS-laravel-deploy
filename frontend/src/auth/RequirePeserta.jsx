import React from "react";
import { useLocation, Navigate, Outlet } from "react-router-dom";

// Komponen ini mengecek DUA hal:
// 1. Apakah sudah login ('loginPeserta')
// 2. Apakah sudah mendaftar ('pesertaData')
const useAuthPeserta = () => {
  const loginData = localStorage.getItem("loginPeserta");
  const pesertaData = localStorage.getItem("pesertaData");

  if (loginData && pesertaData) {
    // Level 2: Sempurna, sudah login DAN sudah daftar
    return "full_access";
  } else if (loginData && !pesertaData) {
    // Level 1: Sudah login, TAPI belum isi form /peserta
    return "login_only";
  } else {
    // Level 0: Belum login sama sekali
    return "no_access";
  }
};

const RequirePeserta = () => {
  const authStatus = useAuthPeserta();
  const location = useLocation();

  if (authStatus === "full_access") {
    // Jika akses penuh, tampilkan halaman ujian
    return <Outlet />;
  } else if (authStatus === "login_only") {
    // Jika baru login (tapi belum isi form), paksa kembali ke form
    return <Navigate to="/peserta" state={{ from: location }} replace />;
  } else {
    // Jika belum login, lempar ke halaman login
    return <Navigate to="/" state={{ from: location }} replace />;
  }
};

export default RequirePeserta;