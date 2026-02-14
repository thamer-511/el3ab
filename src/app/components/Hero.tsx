import React from 'react';
import { motion } from 'motion/react';
import logo from 'figma:asset/7500a9e553a0bd6ca122efd627d48c45b32bf668.png';
import { Gamepad2, Play } from 'lucide-react';

export const Hero = () => {
  return (
    <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden bg-[#FDF8E8] px-4 text-center">
      
      {/* Paper texture overlay (faint grid/lines) */}
      <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#6A8D56 1px, transparent 1px), linear-gradient(90deg, #6A8D56 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Decorative Circles (Retro Style) */}
      <motion.div
        animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute left-[10%] top-[15%] h-32 w-32 rounded-full border-4 border-[#E08C36] bg-[#FDF8E8] shadow-[8px_8px_0px_#6A8D56] md:h-48 md:w-48"
      />
      <motion.div
        animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute right-[10%] bottom-[20%] h-40 w-40 rotate-12 rounded-lg border-4 border-[#6A8D56] bg-[#E08C36] shadow-[8px_8px_0px_#2D3436] md:h-56 md:w-56"
      />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, type: 'spring' }}
          className="mb-8 max-w-2xl"
        >
          <img 
            src={logo} 
            alt="ألعاب زمان" 
            className="w-full drop-shadow-[4px_4px_0px_#E08C36]"
          />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="font-['Lalezar'] text-3xl text-[#6A8D56] md:text-5xl drop-shadow-[2px_2px_0px_#FDF8E8]"
        >
          استرجع ذكريات الطفولة
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mx-auto mt-6 max-w-xl font-['Cairo'] text-xl font-bold text-[#5F6A56] leading-relaxed"
        >
          استمتع بتجربة حنين لا تُنسى مع ألعاب تراثية أصيلة. نافس أصدقاءك وعائلتك في ألعاب مشوقة تعيدك لأجمل الأوقات.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '6px 6px 0px #2D3436' }}
            whileTap={{ scale: 0.95, boxShadow: '2px 2px 0px #2D3436' }}
            className="flex items-center gap-2 rounded-2xl border-4 border-[#6A8D56] bg-[#6A8D56] px-8 py-4 font-['Lalezar'] text-2xl text-[#FDF8E8] shadow-[8px_8px_0px_#2D3436] transition-all"
          >
            <Gamepad2 className="h-8 w-8" />
            ابدأ اللعب الآن
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '6px 6px 0px #E08C36' }}
            whileTap={{ scale: 0.95, boxShadow: '2px 2px 0px #E08C36' }}
            className="flex items-center gap-2 rounded-2xl border-4 border-[#E08C36] bg-[#FDF8E8] px-8 py-4 font-['Lalezar'] text-2xl text-[#E08C36] shadow-[8px_8px_0px_#E08C36] transition-all hover:bg-[#E08C36] hover:text-[#FDF8E8]"
          >
            <Play className="h-8 w-8 fill-current" />
            تصفح الألعاب
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};
