// Subscription system types

export type SubscriptionPlanType = 'one_time' | 'monthly';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface SubscriptionPlan {
  id: string;
  name: string;
  name_ar: string;
  type: SubscriptionPlanType;
  price: number;
  currency: string;
  duration_days: number | null;
  games_limit: number | null;
  features: string; // JSON string
  is_active: number;
  created_at: number;
  updated_at: number;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  games_played: number;
  games_limit: number | null;
  starts_at: number;
  expires_at: number | null;
  cancelled_at: number | null;
  payment_id: string | null;
  created_at: number;
  updated_at: number;
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  subscription_id: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: string | null;
  transaction_reference: string | null;
  metadata: string | null; // JSON string
  created_at: number;
  updated_at: number;
}

// Extended types for API responses
export interface SubscriptionPlanWithFeatures extends Omit<SubscriptionPlan, 'features'> {
  features: string[];
}

export interface UserSubscriptionWithPlan extends UserSubscription {
  plan?: SubscriptionPlanWithFeatures;
}

export interface UserAccessInfo {
  has_access: boolean;
  subscription: UserSubscriptionWithPlan | null;
  games_remaining: number | null; // null = unlimited
  days_remaining: number | null;
  is_expired: boolean;
  needs_subscription: boolean;
}
