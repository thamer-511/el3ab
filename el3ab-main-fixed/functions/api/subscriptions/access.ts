import { getSessionIdFromRequest, getSessionUser } from '../../lib/auth';
import { getUserAccessInfo } from '../../lib/subscriptions';

export interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    // Get authenticated user
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

    // Get user access info
    const accessInfo = await getUserAccessInfo(context.env.DB, user.id);

    return new Response(JSON.stringify(accessInfo), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Get access info error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
