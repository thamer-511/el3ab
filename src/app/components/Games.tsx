import React from 'react';
import { motion } from 'motion/react';
import { Brain, Clock, Grid3X3, Play } from 'lucide-react';
import { Link } from 'react-router';

export const Games = () => {
  return (
    <section id="games" className="relative bg-[#FDF8E8] py-24">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16 text-center">
          <h2 className="font-['Lalezar'] text-6xl text-[#E08C36] drop-shadow-[4px_4px_0px_#6A8D56]">ألعابنا</h2>
          <p className="mt-4 font-['Cairo'] text-xl font-bold text-[#5F6A56]">اختر لعبتك المفضلة وابدأ المتعة</p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            whileHover={{ y: -10, boxShadow: '12px 12px 0px #6A8D56' }}
            className="group relative overflow-hidden rounded-3xl border-4 border-[#6A8D56] bg-white p-8 text-center transition-all shadow-[8px_8px_0px_#6A8D56]"
          >
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-[#2D3436] bg-[#E08C36] shadow-[4px_4px_0px_#2D3436]">
              <Grid3X3 className="h-12 w-12 text-[#FDF8E8]" />
            </div>
            <h3 className="mb-2 font-['Lalezar'] text-4xl text-[#2D3436]">خلية الحروف</h3>
            <p className="mb-6 font-['Cairo'] font-semibold text-[#5F6A56]">لعبة استراتيجية مشوقة تجمع بين الذكاء والسرعة. اربط المسار بلونك وأجب على الأسئلة لتفوز!</p>
            <Link to="/games/alphabet-cell" className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#6A8D56] bg-[#6A8D56] py-3 font-['Lalezar'] text-xl text-[#FDF8E8] transition-all hover:bg-[#FDF8E8] hover:text-[#6A8D56]">
              <Play className="h-6 w-6 fill-current" />
              ابدأ اللعب
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -10, boxShadow: '12px 12px 0px #E08C36' }}
            className="group relative overflow-hidden rounded-3xl border-4 border-[#E08C36] bg-white p-8 text-center transition-all shadow-[8px_8px_0px_#E08C36]"
          >
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-[#2D3436] bg-[#6A8D56] shadow-[4px_4px_0px_#2D3436]">
              <Brain className="h-12 w-12 text-[#FDF8E8]" />
            </div>
            <h3 className="mb-2 font-['Lalezar'] text-4xl text-[#2D3436]">فوازير</h3>
            <p className="mb-6 font-['Cairo'] font-semibold text-[#5F6A56]">اختبر ذكاءك مع 30 فزورة تراثية ممتعة. استخدم القدرة الخاصة للحصول على نقاط مضاعفة!</p>
            <Link to="/games/riddles" className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#E08C36] bg-[#E08C36] py-3 font-['Lalezar'] text-xl text-[#FDF8E8] transition-all hover:bg-[#FDF8E8] hover:text-[#E08C36]">
              <Play className="h-6 w-6 fill-current" />
              ابدأ اللعب
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 }} className="group relative overflow-hidden rounded-3xl border-4 border-dashed border-[#A0AEC0] bg-[#FDF8E8] p-8 text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-[#CBD5E0] bg-[#EDF2F7]">
              <Clock className="h-12 w-12 text-[#A0AEC0]" />
            </div>
            <h3 className="mb-2 font-['Lalezar'] text-4xl text-[#A0AEC0]">المزيد قريباً</h3>
            <p className="mb-6 font-['Cairo'] font-semibold text-[#A0AEC0]">سباق المشاهدين • ولا كلمة • مافيا<br />والمزيد من الألعاب المشوقة في الطريق!</p>
            <button disabled className="w-full cursor-not-allowed rounded-xl bg-[#EDF2F7] py-3 font-['Lalezar'] text-xl text-[#A0AEC0]">
              قريباً...
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
