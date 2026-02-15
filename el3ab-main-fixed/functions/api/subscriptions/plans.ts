import { getSubscriptionPlans } from '../../../lib/subscriptions';
import type { SubscriptionPlan } from '../../../../shared/subscription-types';

export interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const plans = await getSubscriptionPlans(context.env.DB);
    
    // Parse features JSON for each plan
    const plansWithFeatures = plans.map(plan => ({
      ...plan,
      features: JSON.parse(plan.features || '[]'),
    }));

    return new Response(JSON.stringify({ plans: plansWithFeatures }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Get plans error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
