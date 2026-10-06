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
    const { userId, email, newPassword } = await req.json();

    if (!newPassword || newPassword.length < 4) {
      return NextResponse.json(
        { error: 'New passcode must be at least 4 characters long' },
        { status: 400 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    const db = await connectToDatabase();

    // 1. Update in MongoDB Cloud DB
    if (db && db.connection.readyState === 1) {
      try {
        let user;
        if (userId && userId !== 'admin_master' && !userId.startsWith('usr_')) {
          user = await UserModel.findById(userId);
        } else if (email) {
          user = await UserModel.findOne({ email: email.toLowerCase().trim() });
        }

        if (user) {
          user.passwordHash = passwordHash;
          user.mustChangePassword = false;
          await user.save();

          return NextResponse.json({
            message: 'Passcode updated successfully',
            user: {
              id: user._id.toString(),
              name: user.name,
              email: user.email,
              role: user.role,
              currency: user.currency,
              mustChangePassword: false,
            },
          });
        }
      } catch (dbErr: any) {
        console.warn('MongoDB password update error:', dbErr.message);
      }
    }

    // 2. Update in Fallback Store
    if (global.fallbackUsersStore) {
      const fbUserIndex = global.fallbackUsersStore.findIndex(
        (u) => u.id === userId || (email && u.email === email.toLowerCase().trim())
      );

      if (fbUserIndex !== -1) {
        global.fallbackUsersStore[fbUserIndex].passwordHash = passwordHash;
        global.fallbackUsersStore[fbUserIndex].mustChangePassword = false;

        const fbUser = global.fallbackUsersStore[fbUserIndex];
        return NextResponse.json({
          message: 'Passcode updated successfully',
          user: {
            id: fbUser.id,
            name: fbUser.name,
            email: fbUser.email,
            role: fbUser.role,
            currency: fbUser.currency || 'INR',
            mustChangePassword: false,
          },
        });
      }
    }

    return NextResponse.json({ message: 'Passcode updated successfully' });
  } catch (err: any) {
    console.error('Password change error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to update passcode' }, { status: 500 });
  }
}
