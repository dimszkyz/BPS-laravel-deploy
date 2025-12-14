// File: src/admin/ImageUploadBox.jsx (Versi Final)

import React, { useState, useEffect, useRef } from "react";
// Impor yang tidak terpakai (FaImage, FaSpinner) telah dihapus
import { FaUpload, FaTimes } from "react-icons/fa";

const API_URL = "https://kompeta.web.bps.go.id"; // Sesuaikan API URL Anda

const ImageUploadBox = ({ value, onChange, onReset, defaultBgClass }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    let objectUrl = null;

    if (typeof value === 'string' && value) {
      // Ini sudah benar: menggabungkan API_URL
      setPreviewUrl(`${API_URL}${value}`);
    } else if (value instanceof File) {
      // Ini sudah benar: membuat URL preview lokal
      objectUrl = URL.createObjectURL(value);
      setPreviewUrl(objectUrl);
    } else {
      setPreviewUrl(null);
    }

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [value, API_URL]); // Dependensi sudah benar

  const handleFile = (file) => {
    setError("");
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError("File harus berupa gambar (png, jpg, webp, dll).");
        return;
      }
      onChange(file); // Kirim File object ke parent
    }
  };

  // --- Drag and Drop Handlers ---
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  // --- Click to Upload Handler ---
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // --- Tampilan (View) ---
  if (previewUrl) {
    // Tampilan jika ADA gambar (preview)
    return (
      <div className="mt-3 relative w-full h-40 rounded-lg border-2 border-gray-300 group">
        <img
          src={previewUrl}
          alt="Preview"
          // ▼▼▼ PEMBARUAN DI SINI ▼▼▼
          className="w-full h-full object-contain rounded-md" // Diubah ke 'object-contain'
          // ▲▲▲ AKHIR PEMBARUAN ▲▲▲
        />
        <button
          type="button"
          onClick={onReset}
          className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          title="Hapus gambar"
        >
          <FaTimes className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Tampilan jika TIDAK ada gambar (area dropzone)
  return (
    <div className="mt-3">
      <div
        className={`w-full h-40 rounded-lg border-4 border-dashed flex flex-col items-center justify-center text-gray-500 transition-colors
          ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}
          ${!previewUrl && defaultBgClass ? defaultBgClass : 'bg-transparent'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
        />
        <FaUpload className="w-8 h-8 text-gray-400 mb-2" />
        <span className="font-medium">Drag & drop file</span>
        <span className="text-sm">atau klik untuk memilih</span>
        
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default ImageUploadBox;