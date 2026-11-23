import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/common/Navbar.jsx';
import Footer from '../components/common/Footer.jsx';
import { Toaster } from 'sonner';

export default function RootLayout() {
  const location = useLocation();
  const isDisplayBoard = location.pathname === '/board';

  return (
    <div className="flex min-h-screen flex-col bg-[#0B0F17] text-cream">
      {/* Omit Navbar & Footer on live display board for clean TV display */}
      {!isDisplayBoard && <Navbar />}

      <main className="flex-1">
        <Outlet />
      </main>

      {!isDisplayBoard && <Footer />}

      <Toaster
        position="top-right"
        richColors
        theme="dark"
        toastOptions={{
          style: {
            background: '#1F2937',
            borderColor: '#374151',
            color: '#F9FAFB',
          },
        }}
      />
    </div>
  );
}
