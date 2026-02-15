import React from 'react';

type SupportType = 'faq' | 'contact' | 'privacy' | 'terms';

const pageContent: Record<SupportType, { title: string; body: string[] }> = {
  faq: {
    title: 'الأسئلة الشائعة',
    body: [
      'هل المنصة مناسبة للأطفال؟ نعم، المحتوى مصمم للعائلة وجميع الفئات العمرية.',
      'هل أحتاج لتحميل تطبيق؟ لا، يمكنك اللعب مباشرة من المتصفح.',
      'هل يمكن اللعب مع الأصدقاء عن بُعد؟ نعم، توجد جلسات جماعية عبر رابط خاص.',
    ],
  },
  contact: {
    title: 'اتصل بنا',
    body: [
      'البريد الإلكتروني: info@alaaabzaman.com',
      'رقم الواتساب: +966 50 000 0000',
      'ساعات العمل: يومياً من 9 صباحاً حتى 10 مساءً.',
    ],
  },
  privacy: {
    title: 'سياسة الخصوصية',
    body: [
      'نحن نحفظ الحد الأدنى من بياناتك اللازمة لتشغيل الحساب.',
      'لا نبيع بياناتك لأي طرف ثالث.',
      'يمكنك طلب حذف حسابك وبياناتك في أي وقت عبر صفحة التواصل.',
    ],
  },
  terms: {
    title: 'الشروط والأحكام',
    body: [
      'الاستخدام المسموح للمنصة يقتصر على الترفيه الشخصي أو العائلي.',
      'يُمنع إساءة استخدام المنصة أو مشاركة محتوى مخالف.',
      'قد يتم تحديث الشروط دورياً وسيتم إشعار المستخدمين بالتعديلات الجوهرية.',
    ],
  },
};

export const SupportPage = ({ type }: { type: SupportType }) => {
  const content = pageContent[type];

  return (
    <main className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-3xl rounded-3xl border-4 border-[#2D3436] bg-white p-8 shadow-[8px_8px_0px_#E08C36]">
        <h1 className="font-['Lalezar'] text-5xl text-[#6A8D56]">{content.title}</h1>
        <div className="mt-8 space-y-4">
          {content.body.map((line) => (
            <p key={line} className="rounded-xl border-2 border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 font-['Cairo'] text-lg font-semibold text-[#374151]">
              {line}
            </p>
          ))}
        </div>
      </div>
    </main>
  );
};
