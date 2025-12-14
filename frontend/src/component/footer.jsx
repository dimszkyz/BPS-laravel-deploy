import React from 'react';

/**
 * Komponen Footer Universal
 * @param {object} props
 * @param {string} props.bgUrl - URL atau path gambar background, digunakan untuk menentukan transparansi
 */
const Footer = ({ bgUrl }) => {
  return (
    <footer className="w-full border-t border-gray-200 bg-white py-3">
      <div className="max-w-7xl mx-auto text-center text-[12px] text-gray-500">
        © {new Date().getFullYear()} BPS Kota Salatiga. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;