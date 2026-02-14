import React from 'react';
import { motion } from 'motion/react';
import { Check, Star } from 'lucide-react';

export const Pricing = () => {
  return (
    <section className="relative py-24 bg-[#F3EAD3] overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="font-['Lalezar'] text-6xl text-[#6A8D56] drop-shadow-[4px_4px_0px_#E08C36]">
            الأسعار
          </h2>
          <p className="mt-4 font-['Cairo'] text-xl font-bold text-[#5F6A56]">
            اختر الخطة المناسبة لك
          </p>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch max-w-5xl mx-auto">
          {/* Plan 1: One Round */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -10, boxShadow: '12px 12px 0px #2D3436' }}
            className="flex-1 bg-white border-4 border-[#2D3436] rounded-3xl p-8 flex flex-col relative group transition-all shadow-[8px_8px_0px_#2D3436]"
          >
            <h3 className="text-4xl font-['Lalezar'] text-[#2D3436] mb-2">جولة واحدة</h3>
            <div className="text-6xl font-['Lalezar'] text-[#E08C36] mb-2 drop-shadow-[2px_2px_0px_#2D3436]">
              5.99 <span className="text-3xl text-[#5F6A56]">ريال</span>
            </div>
            
            <ul className="mt-8 space-y-4 flex-1">
              {[
                'لعبة واحدة من كل نوع',
                'خلية الحروف - 3 جولات',
                'فوازير - 30 فزورة'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-[#2D3436] font-['Cairo'] font-bold text-lg">
                  <div className="p-1 rounded-full bg-[#F3EAD3] border-2 border-[#2D3436]">
                    <Check size={16} strokeWidth={3} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>

            <button className="mt-8 w-full py-4 rounded-xl border-2 border-[#E08C36] text-[#E08C36] font-['Lalezar'] text-2xl hover:bg-[#E08C36] hover:text-[#FDF8E8] transition-all">
              اشترك الآن
            </button>
          </motion.div>

          {/* Plan 2: Monthly (Featured) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -10, boxShadow: '12px 12px 0px #2D3436' }}
            className="flex-1 bg-[#6A8D56] border-4 border-[#2D3436] rounded-3xl p-8 flex flex-col relative transform md:-translate-y-4 shadow-[8px_8px_0px_#2D3436] transition-all"
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#E08C36] border-4 border-[#2D3436] text-[#FDF8E8] px-6 py-2 rounded-full font-['Lalezar'] text-xl flex items-center gap-2 shadow-[4px_4px_0px_#2D3436]">
              <Star size={20} fill="#FDF8E8" stroke="#2D3436" strokeWidth={2} /> الأكثر شعبية
            </div>

            <h3 className="text-4xl font-['Lalezar'] text-[#FDF8E8] mb-2 mt-2">اشتراك شهري</h3>
            <div className="text-7xl font-['Lalezar'] text-[#FDF8E8] mb-2 drop-shadow-[4px_4px_0px_#2D3436]">
              19.99 <span className="text-3xl text-[#FDF8E8]/80">ريال / شهر</span>
            </div>
            
            <ul className="mt-8 space-y-4 flex-1">
              {[
                'ألعاب غير محدودة',
                'جميع الألعاب الحالية والمستقبلية',
                'بنك أسئلة محدث',
                'دعم فني مميز'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-[#FDF8E8] font-['Cairo'] font-bold text-lg">
                  <div className="p-1 rounded-full bg-[#E08C36] border-2 border-[#FDF8E8] text-[#FDF8E8]">
                    <Check size={16} strokeWidth={4} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>

            <button className="mt-8 w-full py-4 rounded-xl border-4 border-[#FDF8E8] bg-[#FDF8E8] text-[#6A8D56] font-['Lalezar'] text-2xl hover:bg-[#E08C36] hover:text-[#FDF8E8] hover:border-[#E08C36] transition-all shadow-[4px_4px_0px_#2D3436]">
              اشترك الآن
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
