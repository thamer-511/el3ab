import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Users, Palette, RefreshCw, Zap, Smartphone } from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    whileHover={{ y: -5, boxShadow: `8px 8px 0px ${color}` }}
    className="group relative overflow-hidden rounded-2xl border-4 border-[#2D3436] bg-[#FDF8E8] p-6 text-center transition-all shadow-[4px_4px_0px_#2D3436]"
  >
    <div className="mb-4 flex justify-center">
      <div 
        className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#2D3436] bg-white shadow-[4px_4px_0px_#2D3436]"
        style={{ color: color }}
      >
        <Icon className="h-10 w-10 stroke-[2.5]" />
      </div>
    </div>
    
    <h3 className="mb-2 font-['Lalezar'] text-3xl text-[#2D3436]">
      {title}
    </h3>
    
    <p className="font-['Cairo'] font-semibold text-[#5F6A56]">
      {description}
    </p>
  </motion.div>
);

export const Features = () => {
  const features = [
    {
      icon: Trophy,
      title: "منافسة شريفة",
      description: "تحديات ذكية تختبر معلوماتك وسرعة بديهتك",
      color: "#E08C36", // Orange
    },
    {
      icon: Users,
      title: "للعائلة والأصدقاء",
      description: "ألعاب مناسبة لجميع الأعمار تجمع العائلة في أوقات ممتعة",
      color: "#6A8D56", // Olive Green
    },
    {
      icon: Palette,
      title: "تصميم عتيق أصيل",
      description: "تصميم يعيدك لأجواء الماضي الجميل مع لمسة عصرية",
      color: "#E08C36", // Orange
    },
    {
      icon: RefreshCw,
      title: "تحديثات مستمرة",
      description: "ألعاب جديدة وأسئلة محدثة بشكل دوري",
      color: "#6A8D56", // Olive Green
    },
    {
      icon: Zap,
      title: "سهل الاستخدام",
      description: "واجهة بسيطة وسلسة لا تحتاج خبرة تقنية",
      color: "#E08C36", // Orange
    },
    {
      icon: Smartphone,
      title: "متوافق مع كل الأجهزة",
      description: "العب من أي مكان على الهاتف، الجهاز اللوحي أو الكمبيوتر",
      color: "#6A8D56", // Olive Green
    },
  ];

  return (
    <section id="features" className="relative py-24 bg-[#F3EAD3]">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="font-['Lalezar'] text-6xl text-[#6A8D56] drop-shadow-[4px_4px_0px_#E08C36]">
            لماذا ألعاب زمان؟
          </h2>
          <p className="mt-4 font-['Cairo'] text-xl font-bold text-[#5F6A56]">
            تجربة فريدة تجمع بين الحنين والمتعة
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard 
              key={index} 
              {...feature} 
              delay={index * 0.1} 
            />
          ))}
        </div>
      </div>
    </section>
  );
};
