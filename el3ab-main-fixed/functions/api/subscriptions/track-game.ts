import { getSessionIdFromRequest, getSessionUser } from '../../lib/auth';
import { getUserAccessInfo, incrementGamesPlayed } from '../../lib/subscriptions';

export interface Env {
  DB: D1Database;
}

interface TrackGameRequest {
  game_type: string; // 'huruf', 'qawalin', etc.
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
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

    const body = await context.request.json() as TrackGameRequest;

    // Check if user has access
    const accessInfo = await getUserAccessInfo(context.env.DB, user.id);

    if (!accessInfo.has_access) {
      return new Response(JSON.stringify({ 
        error: 'No active subscription',
        needs_subscription: true,
        access_info: accessInfo,
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Increment games played (only for plans with games_limit)
    if (accessInfo.subscription && accessInfo.subscription.games_limit !== null) {
      await incrementGamesPlayed(context.env.DB, accessInfo.subscription.id);
      
      // Get updated access info
      const updatedAccessInfo = await getUserAccessInfo(context.env.DB, user.id);
      
      return new Response(JSON.stringify({ 
        success: true,
        game_type: body.game_type,
        access_info: updatedAccessInfo,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // For unlimited plans, just return success
    return new Response(JSON.stringify({ 
      success: true,
      game_type: body.game_type,
      access_info: accessInfo,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Track game error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
