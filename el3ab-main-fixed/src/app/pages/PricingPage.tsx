import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useSubscription } from '../hooks/useSubscription';
import { motion } from 'motion/react';

export const PricingPage = () => {
  const navigate = useNavigate();
  const { plans, createSubscription, accessInfo } = useSubscription();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    setLoading(planId);
    setError(null);
    
    try {
      await createSubscription(planId, 'test');
      // Success - redirect to games
      navigate('/games');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل الاشتراك');
      setLoading(null);
    }
  };

  return (
    <main className="container mx-auto px-4 py-16 min-h-[80vh]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="font-['Lalezar'] text-5xl md:text-6xl text-[#6A8D56] mb-4">
          اختر الخطة المناسبة لك
        </h1>
        <p className="font-['Cairo'] text-xl text-[#5F6A56]">
          استمتع بألعاب زمان مع أحبابك
        </p>
      </motion.div>

      {/* Current Subscription Info */}
      {accessInfo?.has_access && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto mb-8 rounded-2xl border-2 border-[#6A8D56] bg-white p-6"
        >
          <div className="text-center">
            <p className="font-['Lalezar'] text-2xl text-[#6A8D56] mb-2">
              ✅ لديك اشتراك نشط
            </p>
            <div className="font-['Cairo'] text-[#5F6A56] space-y-1">
              <p>الخطة: {accessInfo.subscription?.plan?.name_ar}</p>
              {accessInfo.games_remaining !== null && (
                <p>الجولات المتبقية: {accessInfo.games_remaining}</p>
              )}
              {accessInfo.games_remaining === null && (
                <p>🎮 ألعاب غير محدودة</p>
              )}
              {accessInfo.days_remaining !== null && (
                <p>ينتهي خلال: {accessInfo.days_remaining} يوم</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-2xl mx-auto mb-8 rounded-2xl border-2 border-red-500 bg-red-50 p-4 text-center"
        >
          <p className="font-['Cairo'] font-bold text-red-600">{error}</p>
        </motion.div>
      )}

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative rounded-3xl border-4 border-[#2D3436] bg-white p-8 shadow-[8px_8px_0px_${
              plan.type === 'monthly' ? '#6A8D56' : '#E08C36'
            }] hover:shadow-[12px_12px_0px_${
              plan.type === 'monthly' ? '#6A8D56' : '#E08C36'
            }] transition-all`}
          >
            {/* Popular Badge */}
            {plan.type === 'monthly' && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#E08C36] text-white px-6 py-2 rounded-full font-['Lalezar'] text-lg shadow-lg border-2 border-[#2D3436]">
                الأكثر شعبية ⭐
              </div>
            )}

            {/* Plan Name */}
            <h2 className="font-['Lalezar'] text-4xl text-center mb-6 mt-2" style={{
              color: plan.type === 'monthly' ? '#6A8D56' : '#E08C36'
            }}>
              {plan.name_ar}
            </h2>

            {/* Price */}
            <div className="text-center mb-8">
              <div className="flex items-baseline justify-center gap-2">
                <span className="font-['Lalezar'] text-6xl" style={{
                  color: plan.type === 'monthly' ? '#6A8D56' : '#E08C36'
                }}>
                  {plan.price}
                </span>
                <div className="flex flex-col items-start">
                  <span className="font-['Cairo'] text-xl text-[#5F6A56]">ريال</span>
                  {plan.type === 'monthly' && (
                    <span className="font-['Cairo'] text-sm text-[#5F6A56]">/شهر</span>
                  )}
                </div>
              </div>
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3 font-['Cairo'] text-[#2D3436]">
                  <span className="text-2xl" style={{
                    color: plan.type === 'monthly' ? '#6A8D56' : '#E08C36'
                  }}>✓</span>
                  <span className="flex-1 pt-1">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Subscribe Button */}
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSubscribe(plan.id)}
              disabled={loading === plan.id}
              className="w-full rounded-xl border-2 py-4 font-['Lalezar'] text-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                borderColor: plan.type === 'monthly' ? '#6A8D56' : '#E08C36',
                backgroundColor: plan.type === 'monthly' ? '#6A8D56' : '#E08C36',
                color: '#FDF8E8'
              }}
            >
              {loading === plan.id ? 'جاري الاشتراك...' : 'اشترك الآن'}
            </motion.button>
          </motion.div>
        ))}
      </div>

      {/* FAQ Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="max-w-3xl mx-auto mt-16"
      >
        <h2 className="font-['Lalezar'] text-3xl text-center text-[#6A8D56] mb-8">
          الأسئلة الشائعة
        </h2>
        <div className="space-y-4">
          <div className="rounded-2xl border-2 border-[#2D3436] bg-white p-6">
            <h3 className="font-['Lalezar'] text-xl text-[#6A8D56] mb-2">
              ما الفرق بين الخطتين؟
            </h3>
            <p className="font-['Cairo'] text-[#5F6A56]">
              الخطة الشهرية تعطيك ألعاب غير محدودة طوال الشهر، بينما جولة واحدة محدودة بـ 3 جولات فقط.
            </p>
          </div>
          <div className="rounded-2xl border-2 border-[#2D3436] bg-white p-6">
            <h3 className="font-['Lalezar'] text-xl text-[#6A8D56] mb-2">
              هل يمكنني إلغاء الاشتراك؟
            </h3>
            <p className="font-['Cairo'] text-[#5F6A56]">
              نعم، يمكنك إلغاء الاشتراك في أي وقت من صفحة حسابك.
            </p>
          </div>
          <div className="rounded-2xl border-2 border-[#2D3436] bg-white p-6">
            <h3 className="font-['Lalezar'] text-xl text-[#6A8D56] mb-2">
              هل الأسعار شاملة الضريبة؟
            </h3>
            <p className="font-['Cairo'] text-[#5F6A56]">
              نعم، جميع الأسعار المعروضة شاملة ضريبة القيمة المضافة.
            </p>
          </div>
        </div>
      </motion.div>
    </main>
  );
};
