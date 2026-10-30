import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';

/**
 * Stateless signed-cookie sessions (HMAC-SHA256). The cookie only carries the user id;
 * role / disabled state are always re-read from the database so they can't go stale.
 */

export const SESSION_COOKIE = 'sp_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

let devSecret: string | null = null;

function getSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.JWT_SECRET || process.env.ENCRYPTION_KEY;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET (or JWT_SECRET) must be set in production.');
  }
  // Dev only: random per-process secret (sessions reset on server restart)
  if (!devSecret) devSecret = crypto.randomBytes(32).toString('hex');
  return devSecret;
}

function sign(data: string): string {
  return crypto.createHmac('sha256', getSecret()).update(data).digest('base64url');
}

export function createSessionToken(userId: string): string {
  const body = Buffer.from(
    JSON.stringify({ uid: userId, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS })
  ).toString('base64url');
  return `${body}.${sign(body)}`;
}

function verifySessionToken(token: string): string | null {
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const { uid, exp } = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (typeof uid !== 'string' || typeof exp !== 'number' || exp < Date.now() / 1000) return null;
    return uid;
  } catch {
    return null;
  }
}

export function setSessionCookie(res: NextResponse, userId: string) {
  res.cookies.set(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}

function readCookie(req: Request, name: string): string | null {
  const header = req.headers.get('cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx !== -1 && part.slice(0, idx).trim() === name) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return null;
}

/** Returns the authenticated (and not disabled) user document, or null. */
export async function getAuthedUser(req: Request) {
  const token = readCookie(req, SESSION_COOKIE);
  if (!token) return null;
  const uid = verifySessionToken(token);
  if (!uid) return null;
  const db = await connectToDatabase();
  if (!db) return null;
  try {
    const user = await UserModel.findById(uid);
    return user && !user.isDisabled ? user : null;
  } catch {
    return null;
  }
}

export function unauthorized(message = 'Authentication required') {
  return NextResponse.json({ error: message }, { status: 401 });
}

/** Returns the authed user if they are an ADMIN, else null. */
export async function getAuthedAdmin(req: Request) {
  const user = await getAuthedUser(req);
  return user && user.role === 'ADMIN' ? user : null;
}
