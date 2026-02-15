import { useState, useEffect, useCallback } from 'react';
import type { UserAccessInfo, SubscriptionPlanWithFeatures } from '../../../shared/subscription-types';

export const useSubscription = () => {
  const [accessInfo, setAccessInfo] = useState<UserAccessInfo | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlanWithFeatures[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch access info
  const fetchAccessInfo = useCallback(async () => {
    try {
      const response = await fetch('/api/subscriptions/access', {
        credentials: 'include',
      });

      if (response.ok) {
        const data: UserAccessInfo = await response.json();
        setAccessInfo(data);
      } else if (response.status === 401) {
        setAccessInfo(null);
      }
    } catch (err) {
      console.error('Error fetching access info:', err);
      setError('فشل تحميل معلومات الاشتراك');
    }
  }, []);

  // Fetch subscription plans
  const fetchPlans = useCallback(async () => {
    try {
      const response = await fetch('/api/subscriptions/plans');
      
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans || []);
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError('فشل تحميل خطط الاشتراك');
    }
  }, []);

  // Create subscription
  const createSubscription = useCallback(async (planId: string, paymentMethod?: string) => {
    try {
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          plan_id: planId,
          payment_method: paymentMethod,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        await fetchAccessInfo(); // Refresh access info
        return data;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'فشل إنشاء الاشتراك');
      }
    } catch (err) {
      throw err;
    }
  }, [fetchAccessInfo]);

  // Track game play
  const trackGamePlay = useCallback(async (gameType: string) => {
    try {
      const response = await fetch('/api/subscriptions/track-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ game_type: gameType }),
      });

      if (response.ok) {
        const data = await response.json();
        setAccessInfo(data.access_info);
        return data;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'فشل تسجيل اللعبة');
      }
    } catch (err) {
      throw err;
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAccessInfo(), fetchPlans()]);
      setLoading(false);
    };

    loadData();
  }, [fetchAccessInfo, fetchPlans]);

  return {
    accessInfo,
    plans,
    loading,
    error,
    hasAccess: accessInfo?.has_access || false,
    needsSubscription: accessInfo?.needs_subscription || false,
    gamesRemaining: accessInfo?.games_remaining,
    daysRemaining: accessInfo?.days_remaining,
    createSubscription,
    trackGamePlay,
    refreshAccessInfo: fetchAccessInfo,
  };
};
