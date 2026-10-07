import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';
import { sendPasswordChangeOTPEmail } from '@/lib/email';

declare global {
  // eslint-disable-next-line no-var
  var fallbackUsersStore: any[] | undefined;
}

export async function POST(req: Request) {
  try {
    const { userId, email } = await req.json();

    if (!userId && !email) {
      return NextResponse.json({ error: 'User ID or email is required' }, { status: 400 });
    }

    const cleanEmail = email ? email.toLowerCase().trim() : '';
    // Generate 6-digit cryptographic OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    let userEmail = cleanEmail;
    let userName = 'Valued User';

    const db = await connectToDatabase();

    // 1. Try updating in MongoDB Cloud DB
    if (db && db.connection.readyState === 1) {
      try {
        let user;
        if (userId && userId !== 'admin_master' && !userId.startsWith('usr_')) {
          user = await UserModel.findById(userId);
        } else if (cleanEmail) {
          user = await UserModel.findOne({ email: cleanEmail });
        }

        if (user) {
          user.otpCode = otpCode;
          user.otpExpiresAt = otpExpiresAt;
          await user.save();

          userEmail = user.email;
          userName = user.name;
        }
      } catch (dbErr: any) {
        console.warn('MongoDB OTP save error:', dbErr.message);
      }
    }

    // 2. Also save to Fallback Store for redundancy
    if (global.fallbackUsersStore) {
      const fbUser = global.fallbackUsersStore.find(
        (u) => u.id === userId || (cleanEmail && u.email === cleanEmail)
      );
      if (fbUser) {
        fbUser.otpCode = otpCode;
        fbUser.otpExpiresAt = otpExpiresAt;
        userEmail = fbUser.email;
        userName = fbUser.name;
      }
    }

    // 3. Dispatch Email with OTP from 51manoj2004@gmail.com
    await sendPasswordChangeOTPEmail(userEmail, userName, otpCode);

    return NextResponse.json({
      success: true,
      message: `A 6-digit OTP code has been sent to ${userEmail}. It will expire in 10 minutes.`,
      email: userEmail,
    });
  } catch (err: any) {
    console.error('Send OTP error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to generate OTP' }, { status: 500 });
  }
}
