import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';

function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.warn('Failed to parse Google JWT payload:', e);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { credential, profile } = body;

    let email = '';
    let name = '';
    let avatar = '';
    let googleId = '';

    // 1. Extract from Google Identity Services ID Token (JWT)
    if (credential) {
      const payload = decodeJwtPayload(credential);
      if (payload) {
        email = payload.email || '';
        name = payload.name || payload.given_name || '';
        avatar = payload.picture || '';
        googleId = payload.sub || '';
      }
    }

    // 2. Extract from Direct Google Profile (fallback / dev / direct Google OAuth)
    if (!email && profile?.email) {
      email = profile.email;
      name = profile.name || email.split('@')[0];
      avatar = profile.avatar || '';
      googleId = profile.googleId || '';
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Valid Google email is required for authentication.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const displayName = name.trim() || cleanEmail.split('@')[0];

    // Master admin email designation
    const isAdminEmail =
      cleanEmail === 'mailfortempusage@gmail.com' ||
      cleanEmail === (process.env.ADMIN_EMAIL || '').toLowerCase().trim();

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

    return NextResponse.json({
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
  } catch (err: any) {
    console.error('Google authentication API error:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error during Google sign in.' },
      { status: 500 }
    );
  }
}

const DEFAULT_GOOGLE_CLIENT_ID = '340953449815-qatnff0fgk0ee9jel8nk8o7tk1mlj4dp.apps.googleusercontent.com';

export async function GET() {
  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    process.env.GOOGLE_CLIENT_ID ||
    DEFAULT_GOOGLE_CLIENT_ID;

  return NextResponse.json({
    clientId,
    isConfigured: Boolean(clientId),
  });
}
