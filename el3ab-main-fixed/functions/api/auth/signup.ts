import { hashPassword, generateUserId, createSession, createSessionCookie } from '../../lib/auth';

export interface Env {
  DB: D1Database;
}

interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as SignupRequest;
    
    // Validate input
    if (!body.email || !body.password || !body.name) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (body.password.length < 8) {
      return new Response(JSON.stringify({ error: 'Password must be at least 8 characters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user already exists
    const existing = await context.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(body.email).first();

    if (existing) {
      return new Response(JSON.stringify({ error: 'Email already registered' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create user
    const userId = generateUserId();
    const passwordHash = await hashPassword(body.password);
    const now = Date.now();

    await context.env.DB.prepare(
      'INSERT INTO users (id, email, password_hash, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(userId, body.email, passwordHash, body.name, now, now).run();

    // Create session
    const session = await createSession(context.env.DB, userId);

    return new Response(JSON.stringify({ 
      user: { 
        id: userId, 
        email: body.email, 
        name: body.name,
        created_at: now,
        updated_at: now,
      } 
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': createSessionCookie(session.id, session.expires_at),
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
