import React from 'react';
import { Gamepad2, Twitter, Instagram, Youtube } from 'lucide-react';
import logo from 'figma:asset/7500a9e553a0bd6ca122efd627d48c45b32bf668.png';

export const Footer = () => {
  return (
    <footer className="relative bg-[#FDF8E8] border-t-4 border-[#6A8D56] pt-16 pb-8 overflow-hidden">
      {/* Texture */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#6A8D56 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-center md:text-right" dir="rtl">
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-2">
              <img src={logo} alt="ألعاب زمان" className="h-10 w-auto object-contain drop-shadow-[2px_2px_0px_#E08C36]" />
            </div>
            <p className="font-['Cairo'] text-[#5F6A56] font-bold leading-relaxed max-w-xs text-center md:text-right">
              منصة ألعاب تراثية تعيدك لذكريات الطفولة الجميلة بأجواء عصرية وممتعة.
            </p>
            <div className="flex gap-4 mt-2">
              <a href="#" className="p-3 rounded-full bg-[#6A8D56] text-[#FDF8E8] border-2 border-[#2D3436] shadow-[2px_2px_0px_#2D3436] hover:-translate-y-1 transition-transform">
                <Twitter size={20} />
              </a>
              <a href="#" className="p-3 rounded-full bg-[#E08C36] text-[#FDF8E8] border-2 border-[#2D3436] shadow-[2px_2px_0px_#2D3436] hover:-translate-y-1 transition-transform">
                <Instagram size={20} />
              </a>
              <a href="#" className="p-3 rounded-full bg-[#e15f5f] text-[#FDF8E8] border-2 border-[#2D3436] shadow-[2px_2px_0px_#2D3436] hover:-translate-y-1 transition-transform">
                <Youtube size={20} />
              </a>
            </div>
          </div>

          {/* Links 1 */}
          <div>
            <h4 className="font-['Lalezar'] text-2xl text-[#6A8D56] mb-6">ألعاب</h4>
            <ul className="space-y-3 font-['Cairo'] text-[#5F6A56] font-bold text-lg">
              <li><a href="#" className="hover:text-[#E08C36] transition-colors">خلية الحروف</a></li>
              <li><a href="#" className="hover:text-[#E08C36] transition-colors">فوازير</a></li>
              <li><a href="#" className="hover:text-[#E08C36] transition-colors">قريباً...</a></li>
            </ul>
          </div>

          {/* Links 2 */}
          <div>
            <h4 className="font-['Lalezar'] text-2xl text-[#6A8D56] mb-6">الدعم</h4>
            <ul className="space-y-3 font-['Cairo'] text-[#5F6A56] font-bold text-lg">
              <li><a href="#" className="hover:text-[#E08C36] transition-colors">الأسئلة الشائعة</a></li>
              <li><a href="#" className="hover:text-[#E08C36] transition-colors">اتصل بنا</a></li>
              <li><a href="#" className="hover:text-[#E08C36] transition-colors">سياسة الخصوصية</a></li>
              <li><a href="#" className="hover:text-[#E08C36] transition-colors">الشروط والأحكام</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-['Lalezar'] text-2xl text-[#6A8D56] mb-6">تواصل معنا</h4>
            <ul className="space-y-3 font-['Cairo'] text-[#5F6A56] font-bold text-lg dir-ltr text-right md:text-right">
              <li className="hover:text-[#E08C36] transition-colors">info@alaaabzaman.com</li>
              <li className="hover:text-[#E08C36] transition-colors" dir="ltr">+966 50 000 0000</li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t-2 border-[#6A8D56]/20 text-center font-['Cairo'] text-[#5F6A56] font-bold text-sm">
          © {new Date().getFullYear()} ألعاب زمان. جميع الحقوق محفوظة.
        </div>
      </div>
    </footer>
  );
};
