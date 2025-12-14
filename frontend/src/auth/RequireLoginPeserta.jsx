import React from "react";
import { useLocation, Navigate, Outlet } from "react-router-dom";

// Komponen ini mengecek apakah 'loginPeserta' ada di localStorage
// Ini adalah level 1: sudah lolos layar login
const useAuthLogin = () => {
  const loginData = localStorage.getItem("loginPeserta");
  return loginData ? true : false;
};

// ▼ UBAH INI
const RequireLoginPeserta = () => {
  const isAuth = useAuthLogin();
  const location = useLocation();

  return isAuth ? (
    // Jika sudah login, tampilkan halaman yang diminta (misal: /peserta)
    <Outlet />
  ) : (
    // Jika belum, lempar ke halaman login
    <Navigate to="/" state={{ from: location }} replace />
  );
};

// ▼ DAN UBAH INI
export default RequireLoginPeserta;