import type { 
  SubscriptionPlan, 
  UserSubscription, 
  UserSubscriptionWithPlan,
  UserAccessInfo,
  SubscriptionStatus 
} from '../../shared/subscription-types';

export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Check if user has active subscription
 */
export async function getUserActiveSubscription(
  db: D1Database, 
  userId: string
): Promise<UserSubscriptionWithPlan | null> {
  const now = Date.now();
  
  const result = await db.prepare(`
    SELECT 
      us.*,
      sp.id as plan_id,
      sp.name as plan_name,
      sp.name_ar as plan_name_ar,
      sp.type as plan_type,
      sp.price as plan_price,
      sp.currency as plan_currency,
      sp.duration_days as plan_duration_days,
      sp.games_limit as plan_games_limit,
      sp.features as plan_features
    FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = ? 
      AND us.status = 'active'
      AND (us.expires_at IS NULL OR us.expires_at > ?)
    ORDER BY us.created_at DESC
    LIMIT 1
  `).bind(userId, now).first<any>();

  if (!result) return null;

  return {
    id: result.id,
    user_id: result.user_id,
    plan_id: result.plan_id,
    status: result.status,
    games_played: result.games_played,
    games_limit: result.games_limit,
    starts_at: result.starts_at,
    expires_at: result.expires_at,
    cancelled_at: result.cancelled_at,
    payment_id: result.payment_id,
    created_at: result.created_at,
    updated_at: result.updated_at,
    plan: {
      id: result.plan_id,
      name: result.plan_name,
      name_ar: result.plan_name_ar,
      type: result.plan_type,
      price: result.plan_price,
      currency: result.plan_currency,
      duration_days: result.plan_duration_days,
      games_limit: result.plan_games_limit,
      features: JSON.parse(result.plan_features || '[]'),
      is_active: 1,
      created_at: result.created_at,
      updated_at: result.updated_at,
    },
  };
}

/**
 * Get user access information
 */
export async function getUserAccessInfo(
  db: D1Database, 
  userId: string
): Promise<UserAccessInfo> {
  const subscription = await getUserActiveSubscription(db, userId);
  
  if (!subscription) {
    return {
      has_access: false,
      subscription: null,
      games_remaining: null,
      days_remaining: null,
      is_expired: false,
      needs_subscription: true,
    };
  }

  const now = Date.now();
  const isExpired = subscription.expires_at ? subscription.expires_at <= now : false;

  const gamesRemaining = subscription.games_limit 
    ? Math.max(0, subscription.games_limit - subscription.games_played)
    : null;

  const daysRemaining = subscription.expires_at
    ? Math.max(0, Math.ceil((subscription.expires_at - now) / (1000 * 60 * 60 * 24)))
    : null;

  const hasAccess = !isExpired && (gamesRemaining === null || gamesRemaining > 0);

  return {
    has_access: hasAccess,
    subscription,
    games_remaining: gamesRemaining,
    days_remaining: daysRemaining,
    is_expired: isExpired,
    needs_subscription: !hasAccess,
  };
}

/**
 * Increment games played counter
 */
export async function incrementGamesPlayed(
  db: D1Database,
  subscriptionId: string
): Promise<void> {
  const now = Date.now();
  await db.prepare(`
    UPDATE user_subscriptions 
    SET games_played = games_played + 1,
        updated_at = ?
    WHERE id = ?
  `).bind(now, subscriptionId).run();
}

/**
 * Create a new subscription for user
 */
export async function createUserSubscription(
  db: D1Database,
  userId: string,
  planId: string,
  paymentId?: string
): Promise<UserSubscription> {
  const plan = await db.prepare(
    'SELECT * FROM subscription_plans WHERE id = ?'
  ).bind(planId).first<SubscriptionPlan>();

  if (!plan) {
    throw new Error('Subscription plan not found');
  }

  const now = Date.now();
  const subscriptionId = generateId();
  const startsAt = now;
  const expiresAt = plan.duration_days 
    ? now + (plan.duration_days * 24 * 60 * 60 * 1000)
    : null;

  const subscription: UserSubscription = {
    id: subscriptionId,
    user_id: userId,
    plan_id: planId,
    status: 'active',
    games_played: 0,
    games_limit: plan.games_limit,
    starts_at: startsAt,
    expires_at: expiresAt,
    cancelled_at: null,
    payment_id: paymentId || null,
    created_at: now,
    updated_at: now,
  };

  await db.prepare(`
    INSERT INTO user_subscriptions (
      id, user_id, plan_id, status, games_played, games_limit,
      starts_at, expires_at, cancelled_at, payment_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    subscription.id, subscription.user_id, subscription.plan_id,
    subscription.status, subscription.games_played, subscription.games_limit,
    subscription.starts_at, subscription.expires_at, subscription.cancelled_at,
    subscription.payment_id, subscription.created_at, subscription.updated_at
  ).run();

  return subscription;
}

/**
 * Cancel user subscription
 */
export async function cancelUserSubscription(
  db: D1Database,
  subscriptionId: string
): Promise<void> {
  const now = Date.now();
  await db.prepare(`
    UPDATE user_subscriptions
    SET status = 'cancelled', cancelled_at = ?, updated_at = ?
    WHERE id = ?
  `).bind(now, now, subscriptionId).run();
}

/**
 * Get all available subscription plans
 */
export async function getSubscriptionPlans(
  db: D1Database
): Promise<SubscriptionPlan[]> {
  const result = await db.prepare(
    'SELECT * FROM subscription_plans WHERE is_active = 1 ORDER BY price ASC'
  ).all<SubscriptionPlan>();

  return result.results || [];
}

/**
 * Expire old subscriptions
 */
export async function expireOldSubscriptions(db: D1Database): Promise<number> {
  const now = Date.now();
  const result = await db.prepare(`
    UPDATE user_subscriptions
    SET status = 'expired', updated_at = ?
    WHERE status = 'active' AND expires_at IS NOT NULL AND expires_at <= ?
  `).bind(now, now).run();

  return result.meta.changes || 0;
}
