import React from 'react';
import { Link } from 'react-router';
import { Pricing } from '../components/Pricing';

export const PricingPage = () => {
  return (
    <main>
      <section className="container mx-auto px-4 pt-12 text-center">
        <h1 className="font-['Lalezar'] text-5xl text-[#6A8D56]">خطط الاشتراك</h1>
        <p className="mt-4 font-['Cairo'] text-lg font-bold text-[#5F6A56]">اختر الخطة المناسبة لك ثم تواصل معنا لإكمال الاشتراك خلال دقائق.</p>
      </section>
      <Pricing />
      <section className="container mx-auto px-4 pb-20 text-center">
        <Link to="/contact" className="inline-block rounded-xl border-2 border-[#6A8D56] bg-[#6A8D56] px-8 py-3 font-['Lalezar'] text-2xl text-[#FDF8E8] shadow-[4px_4px_0px_#2D3436]">
          تواصل مع فريق المبيعات
        </Link>
      </section>
    </main>
  );
};
