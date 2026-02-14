import React, { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { PaperOverlay } from './components/PaperOverlay';
import { HomePage } from './pages/HomePage';
import { GamesPage } from './pages/GamesPage';
import { GameDetailsPage } from './pages/GameDetailsPage';
import { PricingPage } from './pages/PricingPage';
import { SupportPage } from './pages/SupportPage';

function App() {
  useEffect(() => {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#FDF8E8] text-[#2D3436] selection:bg-[#E08C36] selection:text-[#FDF8E8]" dir="rtl">
      <PaperOverlay />

      <div className="relative z-10">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/games" element={<GamesPage />} />
          <Route path="/games/:slug" element={<GameDetailsPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/faq" element={<SupportPage type="faq" />} />
          <Route path="/contact" element={<SupportPage type="contact" />} />
          <Route path="/privacy" element={<SupportPage type="privacy" />} />
          <Route path="/terms" element={<SupportPage type="terms" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Footer />
      </div>
    </div>
  );
}

export default App;
