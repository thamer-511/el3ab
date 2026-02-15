import React from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { Link } from 'react-router';

export const SubscriptionStatus: React.FC = () => {
  const { accessInfo, loading } = useSubscription();

  if (loading) {
    return (
      <div className="rounded-2xl border-2 border-[#6A8D56] bg-white p-4">
        <div className="h-4 w-32 animate-pulse rounded bg-gray-200"></div>
      </div>
    );
  }

  if (!accessInfo || !accessInfo.subscription) {
    return (
      <div className="rounded-2xl border-2 border-[#E08C36] bg-white p-4">
        <p className="font-['Cairo'] font-bold text-[#E08C36]">لا يوجد اشتراك نشط</p>
        <Link 
          to="/pricing"
          className="mt-2 inline-block font-['Cairo'] text-sm text-[#6A8D56] hover:underline"
        >
          اشترك الآن →
        </Link>
      </div>
    );
  }

  const { subscription, games_remaining, days_remaining } = accessInfo;
  const isMonthly = subscription.plan?.type === 'monthly';

  return (
    <div className="rounded-2xl border-2 border-[#6A8D56] bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-['Lalezar'] text-xl text-[#6A8D56]">
            {subscription.plan?.name_ar}
          </h3>
          <div className="mt-2 space-y-1 font-['Cairo'] text-sm text-[#5F6A56]">
            {isMonthly ? (
              <>
                <p>✓ ألعاب غير محدودة</p>
                {days_remaining !== null && (
                  <p>⏱ متبقي {days_remaining} يوم</p>
                )}
              </>
            ) : (
              <>
                {games_remaining !== null && (
                  <p>🎮 متبقي {games_remaining} جولات</p>
                )}
                {days_remaining !== null && (
                  <p>⏱ ينتهي خلال {days_remaining} يوم</p>
                )}
              </>
            )}
          </div>
        </div>
        <div className="rounded-full bg-[#6A8D56] px-3 py-1">
          <span className="font-['Cairo'] text-xs font-bold text-white">نشط</span>
        </div>
      </div>

      {!isMonthly && games_remaining !== null && games_remaining <= 1 && (
        <div className="mt-3 rounded-lg bg-[#FEF3C7] p-2">
          <p className="font-['Cairo'] text-sm text-[#92400E]">
            ⚠️ اقترب اشتراكك من النفاد
          </p>
          <Link 
            to="/pricing"
            className="mt-1 inline-block font-['Cairo'] text-sm text-[#6A8D56] hover:underline"
          >
            جدد اشتراكك →
          </Link>
        </div>
      )}
    </div>
  );
};
