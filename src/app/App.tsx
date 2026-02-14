import React, { useEffect } from 'react';
import { PaperOverlay } from './components/PaperOverlay';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { Games } from './components/Games';
import { Pricing } from './components/Pricing';
import { Footer } from './components/Footer';

function App() {
  // Ensure the document direction is RTL
  useEffect(() => {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
  }, []);

  return (
    <div className="relative min-h-screen bg-[#FDF8E8] text-[#2D3436] overflow-x-hidden selection:bg-[#E08C36] selection:text-[#FDF8E8]" dir="rtl">
      <PaperOverlay />
      
      <div className="relative z-10">
        <Navbar />
        <Hero />
        <Features />
        <Games />
        <Pricing />
        <Footer />
      </div>
    </div>
  );
}

export default App;
