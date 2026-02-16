import { getSessionIdFromRequest, getSessionUser } from '../../lib/auth';
import { createUserSubscription, generateId } from '../../lib/subscriptions';
import type { PaymentTransaction } from '../../../shared/subscription-types';

export interface Env {
  DB: D1Database;
}

interface CreateSubscriptionRequest {
  plan_id: string;
  payment_method?: string;
  payment_reference?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const sessionId = getSessionIdFromRequest(context.request);
    
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = await getSessionUser(context.env.DB, sessionId);
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired session' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await context.request.json() as CreateSubscriptionRequest;
    
    if (!body.plan_id) {
      return new Response(JSON.stringify({ error: 'Missing plan_id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const plan = await context.env.DB.prepare(
      'SELECT * FROM subscription_plans WHERE id = ? AND is_active = 1'
    ).bind(body.plan_id).first();

    if (!plan) {
      return new Response(JSON.stringify({ error: 'Invalid subscription plan' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const paymentId = generateId();
    const now = Date.now();
    
    const payment: PaymentTransaction = {
      id: paymentId,
      user_id: user.id,
      subscription_id: null,
      amount: plan.price as number,
      currency: plan.currency as string,
      status: 'completed',
      payment_method: body.payment_method || null,
      transaction_reference: body.payment_reference || null,
      metadata: null,
      created_at: now,
      updated_at: now,
    };

    await context.env.DB.prepare(`
      INSERT INTO payment_transactions (
        id, user_id, subscription_id, amount, currency, status,
        payment_method, transaction_reference, metadata, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      payment.id, payment.user_id, payment.subscription_id,
      payment.amount, payment.currency, payment.status,
      payment.payment_method, payment.transaction_reference,
      payment.metadata, payment.created_at, payment.updated_at
    ).run();

    const subscription = await createUserSubscription(
      context.env.DB, user.id, body.plan_id, paymentId
    );

    await context.env.DB.prepare(
      'UPDATE payment_transactions SET subscription_id = ?, updated_at = ? WHERE id = ?'
    ).bind(subscription.id, now, paymentId).run();

    return new Response(JSON.stringify({ success: true, subscription, payment }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
