import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';
import bcrypt from 'bcryptjs';

declare global {
  // eslint-disable-next-line no-var
  var fallbackUsersStore: any[] | undefined;
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    const db = await connectToDatabase();

    if (db && db.connection.readyState === 1) {
      try {
        const users = await UserModel.find({ email: cleanEmail }).sort({ createdAt: -1 });
        for (const user of users) {
          if (user.isDisabled) {
            return NextResponse.json(
              { error: 'Your account has been disabled by Administrator. Access is blocked.' },
              { status: 403 }
            );
          }
          const isValid = await bcrypt.compare(password, user.passwordHash);
          if (isValid) {
            return NextResponse.json({
              user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                currency: user.currency,
                isGuest: false,
                mustChangePassword: user.mustChangePassword || false,
                isDisabled: user.isDisabled || false,
              },
            });
          }
        }
      } catch (err: any) {
        console.warn('Database login query failed:', err.message);
      }
    }

    // Fallback store check if database is temporarily unreachable
    const fallbackUsers = global.fallbackUsersStore?.filter((u) => u.email === cleanEmail) || [];
    for (const fallbackUser of fallbackUsers) {
      if (fallbackUser.isDisabled) continue;
      const isValid = await bcrypt.compare(password, fallbackUser.passwordHash);
      if (isValid) {
        return NextResponse.json({
          user: {
            id: fallbackUser.id,
            name: fallbackUser.name,
            email: fallbackUser.email,
            role: fallbackUser.role,
            currency: fallbackUser.currency || 'INR',
            isGuest: false,
            mustChangePassword: fallbackUser.mustChangePassword || false,
            isDisabled: fallbackUser.isDisabled || false,
          },
        });
      }
    }

    return NextResponse.json(
      { error: 'Invalid email or password credentials.' },
      { status: 401 }
    );
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error during authentication' }, { status: 500 });
  }
}
