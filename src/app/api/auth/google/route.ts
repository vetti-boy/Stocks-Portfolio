import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';
import { GOOGLE_CLIENT_ID, isMasterAdminEmail } from '@/lib/config';
import { setSessionCookie } from '@/lib/session';

interface VerifiedGoogleIdentity {
  email: string;
  name: string;
  avatar: string;
  googleId: string;
}

async function fetchJson(url: string, init?: RequestInit): Promise<any | null> {
  try {
    const res = await fetch(url, { ...init, cache: 'no-store' });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

/** Verifies a Google Identity Services ID token (signature, expiry) via Google and checks audience. */
async function verifyIdToken(idToken: string): Promise<VerifiedGoogleIdentity | null> {
  const info = await fetchJson(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
  if (!info || info.aud !== GOOGLE_CLIENT_ID) return null;
  if (!info.email || String(info.email_verified) !== 'true') return null;
  if (Number(info.exp) < Date.now() / 1000) return null;
  return { email: info.email, name: info.name || info.given_name || '', avatar: info.picture || '', googleId: info.sub || '' };
}

/** Verifies an OAuth access token was issued to this app's client, then reads the profile. */
async function verifyAccessToken(accessToken: string): Promise<VerifiedGoogleIdentity | null> {
  const info = await fetchJson(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`);
  if (!info || (info.aud !== GOOGLE_CLIENT_ID && info.azp !== GOOGLE_CLIENT_ID)) return null;
  const profile = await fetchJson('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!profile?.email || profile.email_verified === false) return null;
  return { email: profile.email, name: profile.name || profile.given_name || '', avatar: profile.picture || '', googleId: profile.sub || '' };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { credential, accessToken } = body;

    let identity: VerifiedGoogleIdentity | null = null;
    if (typeof credential === 'string' && credential) identity = await verifyIdToken(credential);
    else if (typeof accessToken === 'string' && accessToken) identity = await verifyAccessToken(accessToken);

    if (!identity) {
      return NextResponse.json({ error: 'Google authentication could not be verified.' }, { status: 401 });
    }

    const { email, name, avatar, googleId } = identity;

    if (!email) {
      return NextResponse.json(
        { error: 'Valid Google email is required for authentication.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const displayName = name.trim() || cleanEmail.split('@')[0];

    // Master admin email designation
    const isAdminEmail = isMasterAdminEmail(cleanEmail);

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json(
        {
          error:
            'MongoDB Cloud Database connection timed out. In your MongoDB Atlas Dashboard -> Network Access, please click "+ Add IP Address" and select "Allow Access from Anywhere (0.0.0.0/0)" so Vercel can connect.',
        },
        { status: 503 }
      );
    }

    // Query existing user in MongoDB
    let user = await UserModel.findOne({
      $or: [
        { email: cleanEmail },
        ...(googleId ? [{ googleId }] : []),
      ],
    });

    if (user) {
      if (user.isDisabled) {
        return NextResponse.json(
          { error: 'Your account has been disabled by Administrator. Access is blocked.' },
          { status: 403 }
        );
      }

      // Update Google profile fields
      if (googleId && !user.googleId) user.googleId = googleId;
      if (avatar && (!user.avatar || user.avatar !== avatar)) user.avatar = avatar;
      if (displayName && user.name !== displayName && !user.name) user.name = displayName;
      if (isAdminEmail && user.role !== 'ADMIN') user.role = 'ADMIN';

      await user.save();
    } else {
      // Auto-create new user with Google profile
      user = await UserModel.create({
        name: displayName,
        email: cleanEmail,
        googleId: googleId || undefined,
        avatar: avatar || undefined,
        role: isAdminEmail ? 'ADMIN' : 'USER',
        currency: 'INR',
        isDisabled: false,
      });
    }

    const response = NextResponse.json({
      success: true,
      message: 'Google authentication successful.',
      user: {
        id: user._id.toString(),
        googleId: user.googleId,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        currency: user.currency || 'INR',
        isDisabled: false,
      },
    });
    setSessionCookie(response, user._id.toString());
    return response;
  } catch (err: any) {
    console.error('Google authentication API error:', err);
    return NextResponse.json({ error: 'Internal server error during Google sign in.' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    clientId: GOOGLE_CLIENT_ID,
    isConfigured: Boolean(GOOGLE_CLIENT_ID),
  });
}
