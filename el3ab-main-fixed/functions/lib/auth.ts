// Authentication utilities for Cloudflare Workers

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

export function generateSessionId(): string {
  return crypto.randomUUID();
}

export function generateUserId(): string {
  return crypto.randomUUID();
}

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: number;
  updated_at: number;
}

export interface Session {
  id: string;
  user_id: string;
  expires_at: number;
  created_at: number;
}

export async function createSession(db: D1Database, userId: string): Promise<Session> {
  const sessionId = generateSessionId();
  const now = Date.now();
  const expiresAt = now + (7 * 24 * 60 * 60 * 1000); // 7 days

  await db.prepare(
    'INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)'
  ).bind(sessionId, userId, expiresAt, now).run();

  return {
    id: sessionId,
    user_id: userId,
    expires_at: expiresAt,
    created_at: now,
  };
}

export async function getSessionUser(db: D1Database, sessionId: string): Promise<User | null> {
  const now = Date.now();
  
  const result = await db.prepare(`
    SELECT u.id, u.email, u.name, u.created_at, u.updated_at
    FROM users u
    JOIN sessions s ON u.id = s.user_id
    WHERE s.id = ? AND s.expires_at > ?
  `).bind(sessionId, now).first<User>();

  return result || null;
}

export async function deleteSession(db: D1Database, sessionId: string): Promise<void> {
  await db.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
}

export function getSessionIdFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map(c => c.trim());
  for (const cookie of cookies) {
    const [name, value] = cookie.split('=');
    if (name === 'session_id') {
      return value;
    }
  }
  return null;
}

export function createSessionCookie(sessionId: string, expiresAt: number): string {
  const expires = new Date(expiresAt).toUTCString();
  return `session_id=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=${expires}`;
}

export function clearSessionCookie(): string {
  return 'session_id=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
}
