import React from 'react';
import { Instagram, Twitter, Youtube } from 'lucide-react';
import { Link } from 'react-router';
import logo from '../../assets/7500a9e553a0bd6ca122efd627d48c45b32bf668.png';

export const Footer = () => {
  return (
    <footer className="relative overflow-hidden border-t-4 border-[#6A8D56] bg-[#FDF8E8] pb-8 pt-16">
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#6A8D56 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

      <div className="container relative z-10 mx-auto px-4">
        <div className="grid grid-cols-1 gap-12 text-center md:grid-cols-2 md:text-right lg:grid-cols-4" dir="rtl">
          <div className="flex flex-col items-center gap-4 md:items-start">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="ألعاب زمان" className="h-10 w-auto object-contain drop-shadow-[2px_2px_0px_#E08C36]" />
            </Link>
            <p className="max-w-xs text-center font-['Cairo'] font-bold leading-relaxed text-[#5F6A56] md:text-right">منصة ألعاب تراثية تعيدك لذكريات الطفولة الجميلة بأجواء عصرية وممتعة.</p>
            <div className="mt-2 flex gap-4">
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="rounded-full border-2 border-[#2D3436] bg-[#6A8D56] p-3 text-[#FDF8E8] shadow-[2px_2px_0px_#2D3436] transition-transform hover:-translate-y-1"><Twitter size={20} /></a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="rounded-full border-2 border-[#2D3436] bg-[#E08C36] p-3 text-[#FDF8E8] shadow-[2px_2px_0px_#2D3436] transition-transform hover:-translate-y-1"><Instagram size={20} /></a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" className="rounded-full border-2 border-[#2D3436] bg-[#e15f5f] p-3 text-[#FDF8E8] shadow-[2px_2px_0px_#2D3436] transition-transform hover:-translate-y-1"><Youtube size={20} /></a>
            </div>
          </div>

          <div>
            <h4 className="mb-6 font-['Lalezar'] text-2xl text-[#6A8D56]">ألعاب</h4>
            <ul className="space-y-3 font-['Cairo'] text-lg font-bold text-[#5F6A56]">
              <li><Link to="/games/alphabet-cell" className="transition-colors hover:text-[#E08C36]">خلية الحروف</Link></li>
              <li><Link to="/games/riddles" className="transition-colors hover:text-[#E08C36]">فوازير</Link></li>
              <li><Link to="/games" className="transition-colors hover:text-[#E08C36]">كل الألعاب</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 font-['Lalezar'] text-2xl text-[#6A8D56]">الدعم</h4>
            <ul className="space-y-3 font-['Cairo'] text-lg font-bold text-[#5F6A56]">
              <li><Link to="/faq" className="transition-colors hover:text-[#E08C36]">الأسئلة الشائعة</Link></li>
              <li><Link to="/contact" className="transition-colors hover:text-[#E08C36]">اتصل بنا</Link></li>
              <li><Link to="/privacy" className="transition-colors hover:text-[#E08C36]">سياسة الخصوصية</Link></li>
              <li><Link to="/terms" className="transition-colors hover:text-[#E08C36]">الشروط والأحكام</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 font-['Lalezar'] text-2xl text-[#6A8D56]">تواصل معنا</h4>
            <ul className="dir-ltr space-y-3 text-right font-['Cairo'] text-lg font-bold text-[#5F6A56] md:text-right">
              <li><a href="mailto:info@alaaabzaman.com" className="transition-colors hover:text-[#E08C36]">info@alaaabzaman.com</a></li>
              <li><a href="tel:+966500000000" className="transition-colors hover:text-[#E08C36]" dir="ltr">+966 50 000 0000</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 border-t-2 border-[#6A8D56]/20 pt-8 text-center font-['Cairo'] text-sm font-bold text-[#5F6A56]">© {new Date().getFullYear()} ألعاب زمان. جميع الحقوق محفوظة.</div>
      </div>
    </footer>
  );
};
