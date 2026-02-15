import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import type { UserAccessInfo } from '../../../shared/subscription-types';

interface SubscriptionGateProps {
  children: React.ReactNode;
  gameType?: string;
}

export const SubscriptionGate: React.FC<SubscriptionGateProps> = ({ children, gameType }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [accessInfo, setAccessInfo] = useState<UserAccessInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      // 1. تأكد من تسجيل الدخول
      if (!user) {
        console.log('🔒 ما في مستخدم - تحويل للـ login');
        navigate('/login');
        return;
      }

      try {
        console.log('🔍 جاري التحقق من الوصول...');
        
        const response = await fetch('/api/subscriptions/access', {
          credentials: 'include',
        });

        console.log('📡 Response status:', response.status);

        if (response.ok) {
          const data: UserAccessInfo = await response.json();
          console.log('📊 Access Info:', data);
          
          setAccessInfo(data);

          // 2. شيك الوصول
          if (!data.has_access) {
            console.log('❌ ما عنده وصول - تحويل للأسعار');
            console.log('السبب:', {
              is_expired: data.is_expired,
              games_remaining: data.games_remaining,
              needs_subscription: data.needs_subscription
            });
            navigate('/pricing');
          } else {
            console.log('✅ عنده وصول - السماح بالدخول');
          }
        } else {
          const errorData = await response.json();
          console.error('❌ خطأ في API:', errorData);
          setError(errorData.error || 'خطأ غير معروف');
          navigate('/pricing');
        }
      } catch (error) {
        console.error('💥 Exception:', error);
        setError(error instanceof Error ? error.message : 'خطأ غير معروف');
        navigate('/pricing');
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#6A8D56] border-t-transparent"></div>
          <p className="mt-4 font-['Cairo'] font-bold text-[#5F6A56]">جاري التحقق من الاشتراك...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="text-center">
          <p className="font-['Cairo'] font-bold text-red-600">خطأ: {error}</p>
          <button 
            onClick={() => navigate('/pricing')}
            className="mt-4 rounded-lg bg-[#6A8D56] px-6 py-2 font-['Cairo'] text-white"
          >
            اذهب للأسعار
          </button>
        </div>
      </div>
    );
  }

  if (!accessInfo?.has_access) {
    return null;
  }

  return <>{children}</>;
};
