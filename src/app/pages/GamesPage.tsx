import React from 'react';
import { Link } from 'react-router';
import { Games } from '../components/Games';

export const GamesPage = () => {
  return (
    <main>
      <section className="container mx-auto px-4 pt-12 text-center">
        <h1 className="font-['Lalezar'] text-5xl text-[#6A8D56]">مكتبة الألعاب</h1>
        <p className="mt-4 font-['Cairo'] text-lg font-bold text-[#5F6A56]">
          اختر لعبتك وادخل على صفحة التفاصيل لمعرفة القواعد وطريقة اللعب.
        </p>
      </section>
      <Games />
      <section className="container mx-auto px-4 pb-20 text-center">
        <div className="inline-flex flex-wrap items-center justify-center gap-4 rounded-2xl border-4 border-[#2D3436] bg-white p-5 shadow-[6px_6px_0px_#E08C36]">
          <Link to="/games/alphabet-cell" className="rounded-xl border-2 border-[#6A8D56] bg-[#6A8D56] px-6 py-2 font-['Lalezar'] text-xl text-[#FDF8E8]">
            صفحة خلية الحروف
          </Link>
          <Link to="/games/riddles" className="rounded-xl border-2 border-[#E08C36] bg-[#E08C36] px-6 py-2 font-['Lalezar'] text-xl text-[#FDF8E8]">
            صفحة فوازير
          </Link>
          <Link to="/games/huruf" className="rounded-xl border-2 border-[#2D3436] bg-[#FDF8E8] px-6 py-2 font-['Lalezar'] text-xl text-[#2D3436]">
            خلية الحروف (شاشة رئيسية)
          </Link>
        </div>
      </section>
    </main>
  );
};
