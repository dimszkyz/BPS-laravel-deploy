import React from 'react';
import { Outlet } from 'react-router-dom';
import Footer from '../component/footer';
import Header from '../component/header'; 

const LayoutPeserta = () => {
  const bgUrl = null; 

  return (
    <div className="flex flex-col min-h-screen">
      
      <Header />
      <main className="flex-grow flex">
        <Outlet />
      </main>

      <Footer bgUrl={bgUrl} />
    </div>
  );
};

export default LayoutPeserta;