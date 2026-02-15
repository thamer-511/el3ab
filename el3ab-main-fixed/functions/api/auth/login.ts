import { verifyPassword, createSession, createSessionCookie, User } from '../../lib/auth';

export interface Env {
  DB: D1Database;
}

interface LoginRequest {
  email: string;
  password: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as LoginRequest;
    
    // Validate input
    if (!body.email || !body.password) {
      return new Response(JSON.stringify({ error: 'Missing email or password' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get user
    const user = await context.env.DB.prepare(
      'SELECT id, email, name, password_hash, created_at, updated_at FROM users WHERE email = ?'
    ).bind(body.email).first<User & { password_hash: string }>();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify password
    const isValid = await verifyPassword(body.password, user.password_hash);
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create session
    const session = await createSession(context.env.DB, user.id);

    return new Response(JSON.stringify({ 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        created_at: user.created_at,
        updated_at: user.updated_at,
      } 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': createSessionCookie(session.id, session.expires_at),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
