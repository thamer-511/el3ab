import React from 'react';
import { motion } from 'motion/react';
import logo from 'asset/mainlogo.png';

export const Navbar = () => {
  return (
    <nav className="sticky top-0 z-40 border-b-4 border-[#6A8D56] bg-[#FDF8E8]">
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        {/* Brand/Logo */}
        <div className="flex items-center gap-2">
          <img src={logo} alt="ألعاب زمان" className="h-12 w-auto object-contain drop-shadow-[2px_2px_0px_#E08C36]" />
        </div>

        {/* Links */}
        <div className="hidden items-center gap-8 md:flex">
          {['الرئيسية', 'المميزات', 'الألعاب', 'الأسعار'].map((item, index) => (
            <a
              key={index}
              href="#"
              className="font-['Lalezar'] text-xl text-[#6A8D56] transition-transform hover:-translate-y-1 hover:text-[#E08C36]"
            >
              {item}
            </a>
          ))}
        </div>

        {/* CTA Button */}
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95, y: 0 }}
          className="rounded-full border-2 border-[#E08C36] bg-[#E08C36] px-6 py-2 font-['Lalezar'] text-lg text-[#FDF8E8] shadow-[4px_4px_0px_#6A8D56] transition-all hover:bg-[#FDF8E8] hover:text-[#E08C36]"
        >
          ابدأ اللعب
        </motion.button>
      </div>
    </nav>
  );
};
