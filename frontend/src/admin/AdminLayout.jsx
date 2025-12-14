// File: src/admin/AdminLayout.jsx
import React from 'react';
import Sidebar from "../component/sidebar.jsx";
import { Outlet } from "react-router-dom";
import Footer from "../component/footer.jsx"; 
import NotifNonaktif from "../component/NotifNonaktif.jsx"; // <--- Import Component Baru

const AdminLayout = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Component Notifikasi Global dipasang di sini agar muncul di atas semua konten */}
      <NotifNonaktif />

      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>

        <Footer bgUrl={null} />
      </main>
    </div>
  );
};

export default AdminLayout;