import { getSessionIdFromRequest, getSessionUser } from '../../../lib/auth';

export interface Env {
  DB: D1Database;
  HURUF_SESSION_DO: DurableObjectNamespace;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const requestedState = (await context.request.json().catch(() => ({}))) as { matchWins?: { green?: number; red?: number } };
    const initialMatchWins = requestedState.matchWins
      ? {
          green: Number(requestedState.matchWins.green ?? 0),
          red: Number(requestedState.matchWins.red ?? 0),
        }
      : undefined;

    // Check authentication
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

    // Create a new Durable Object instance for the game session
    const doId = context.env.HURUF_SESSION_DO.newUniqueId();
    const stub = context.env.HURUF_SESSION_DO.get(doId);

    // Initialize the session inside the Durable Object
    const initResponse = await stub.fetch('https://huruf.internal/init', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ matchWins: initialMatchWins }),
    });

    if (!initResponse.ok) {
      throw new Error('Failed to initialize Huruf session in Durable Object');
    }

    return new Response(JSON.stringify({ sessionId: doId.toString() }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Create session error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
