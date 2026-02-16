import React from 'react';
import { Link, useParams } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';

const gamesContent: Record<string, { title: string; summary: string; rules: string[]; playPath: string }> = {
  'alphabet-cell': {
    title: 'خلية الحروف',
    summary: 'لعبة تنافسية تعتمد على تكوين مسار صحيح عبر لوحة الحروف قبل خصمك.',
    playPath: '/games/huruf',
    rules: [
      'كل لاعب يختار لونًا ويبدأ من زاوية مختلفة.',
      'في كل دور يجب الإجابة على سؤال قبل تثبيت الحركة على اللوحة.',
      'أول لاعب يصل إلى المسار الكامل يفوز بالجولة.',
    ],
  },
  riddles: {
    title: 'فوازير',
    summary: 'سلسلة فوازير تراثية ممتعة بوقت محدد وتحدي مباشر بين اللاعبين.',
    playPath: '/games/riddles/play',
    rules: [
      'لكل لغز 20 ثانية فقط للإجابة.',
      'يمكن تفعيل المساعدة مرة واحدة كل جولة.',
      'الفائز هو صاحب أعلى نقاط بعد 10 ألغاز.',
    ],
  },
};

export const GameDetailsPage = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const { hasAccess, loading } = useSubscription();
  const content = slug ? gamesContent[slug] : undefined;

  if (!content) {
    return (
      <main className="container mx-auto px-4 py-20 text-center">
        <h1 className="font-['Lalezar'] text-5xl text-[#E08C36]">اللعبة غير متوفرة حالياً</h1>
        <p className="mt-4 font-['Cairo'] text-lg font-bold text-[#5F6A56]">الصفحة المطلوبة غير موجودة حالياً، جرب لعبة أخرى من المكتبة.</p>
        <Link to="/games" className="mt-8 inline-block rounded-xl border-2 border-[#6A8D56] bg-[#6A8D56] px-6 py-3 font-['Lalezar'] text-xl text-[#FDF8E8]">
          العودة لمكتبة الألعاب
        </Link>
      </main>
    );
  }

  // Determine where the button should go and what it should say
  const getButtonConfig = () => {
    if (!user) {
      return { to: '/login', label: 'سجل دخولك وابدأ اللعب', color: '#E08C36' };
    }
    if (loading) {
      return { to: '#', label: 'جاري التحقق...', color: '#999' };
    }
    if (hasAccess) {
      return { to: content.playPath, label: 'ابدأ اللعب 🎮', color: '#6A8D56' };
    }
    return { to: '/pricing', label: 'اشترك وابدأ اللعب', color: '#E08C36' };
  };

  const btn = getButtonConfig();

  return (
    <main className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-3xl rounded-3xl border-4 border-[#2D3436] bg-white p-8 shadow-[8px_8px_0px_#6A8D56]">
        <h1 className="font-['Lalezar'] text-5xl text-[#6A8D56]">{content.title}</h1>
        <p className="mt-4 font-['Cairo'] text-xl font-bold text-[#5F6A56]">{content.summary}</p>
        <h2 className="mt-8 font-['Lalezar'] text-3xl text-[#E08C36]">طريقة اللعب</h2>
        <ul className="mt-4 space-y-3">
          {content.rules.map((rule) => (
            <li key={rule} className="rounded-xl border-2 border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 font-['Cairo'] font-semibold text-[#374151]">
              {rule}
            </li>
          ))}
        </ul>
        <Link 
          to={btn.to} 
          className="mt-8 inline-block rounded-xl border-2 px-6 py-3 font-['Lalezar'] text-xl text-[#FDF8E8] transition-all hover:opacity-90"
          style={{ borderColor: btn.color, backgroundColor: btn.color }}
        >
          {btn.label}
        </Link>
      </div>
    </main>
  );
};
