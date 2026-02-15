import React from 'react';
import { motion } from 'motion/react';
import { Link, NavLink } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import logo from '../../assets/7500a9e553a0bd6ca122efd627d48c45b32bf668.png';

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-40 border-b-4 border-[#6A8D56] bg-[#FDF8E8]">
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="ألعاب زمان" className="h-12 w-auto object-contain drop-shadow-[2px_2px_0px_#E08C36]" />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <NavLink to="/" className={({ isActive }) => `font-['Lalezar'] text-xl transition-transform hover:-translate-y-1 ${isActive ? 'text-[#E08C36]' : 'text-[#6A8D56] hover:text-[#E08C36]'}`}>
            الرئيسية
          </NavLink>
          <a href="/#features" className="font-['Lalezar'] text-xl text-[#6A8D56] transition-transform hover:-translate-y-1 hover:text-[#E08C36]">المميزات</a>
          <NavLink to="/games" className={({ isActive }) => `font-['Lalezar'] text-xl transition-transform hover:-translate-y-1 ${isActive ? 'text-[#E08C36]' : 'text-[#6A8D56] hover:text-[#E08C36]'}`}>
            الألعاب
          </NavLink>
          <NavLink to="/pricing" className={({ isActive }) => `font-['Lalezar'] text-xl transition-transform hover:-translate-y-1 ${isActive ? 'text-[#E08C36]' : 'text-[#6A8D56] hover:text-[#E08C36]'}`}>
            الأسعار
          </NavLink>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden md:block font-['Cairo'] font-bold text-[#5F6A56]">
                مرحباً، {user.name}
              </span>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95, y: 0 }}
                onClick={() => logout()}
                className="rounded-full border-2 border-[#E08C36] bg-[#E08C36] px-6 py-2 font-['Lalezar'] text-lg text-[#FDF8E8] shadow-[4px_4px_0px_#6A8D56] transition-all hover:bg-[#FDF8E8] hover:text-[#E08C36]"
              >
                تسجيل الخروج
              </motion.button>
            </>
          ) : (
            <>
              <Link to="/login">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95, y: 0 }}
                  className="rounded-full border-2 border-[#6A8D56] bg-[#FDF8E8] px-6 py-2 font-['Lalezar'] text-lg text-[#6A8D56] shadow-[4px_4px_0px_#6A8D56] transition-all hover:bg-[#6A8D56] hover:text-[#FDF8E8]"
                >
                  تسجيل الدخول
                </motion.button>
              </Link>
              <Link to="/signup">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95, y: 0 }}
                  className="rounded-full border-2 border-[#E08C36] bg-[#E08C36] px-6 py-2 font-['Lalezar'] text-lg text-[#FDF8E8] shadow-[4px_4px_0px_#6A8D56] transition-all hover:bg-[#FDF8E8] hover:text-[#E08C36]"
                >
                  إنشاء حساب
                </motion.button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
