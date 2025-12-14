import React from "react";
import { Navigate } from "react-router-dom";
// HAPUS: import { jwtDecode } from "jwt-decode"; 

const ProtectedAdminRoute = ({ children }) => {
  const token = sessionStorage.getItem("adminToken");

  // Cek keberadaan token saja
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  // HAPUS: Blok try-catch jwtDecode di sini.
  // Token Sanctum tidak bisa didecode di frontend untuk cek expired.
  // Jika token expired, nanti API akan return 401 dan frontend akan handle logout di sana.

  return children;
};

export default ProtectedAdminRoute;