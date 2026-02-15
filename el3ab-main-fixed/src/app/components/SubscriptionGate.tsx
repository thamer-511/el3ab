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

  useEffect(() => {
    const checkAccess = async () => {
      // 1. Check if user is logged in
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch('/api/subscriptions/access', {
          credentials: 'include',
        });

        if (response.ok) {
          const data: UserAccessInfo = await response.json();
          setAccessInfo(data);

          // 2. Check if user has access
          if (!data.has_access) {
            // No access - redirect to pricing
            navigate('/pricing');
          }
          // If has access, component will render children
        } else {
          // API error - redirect to pricing
          navigate('/pricing');
        }
      } catch (error) {
        console.error('Subscription check error:', error);
        // Network error - redirect to pricing
        navigate('/pricing');
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [user, navigate]);

  // Loading state
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

  // No access - will redirect, return null
  if (!accessInfo?.has_access) {
    return null;
  }

  // Has access - render the game!
  return <>{children}</>;
};
