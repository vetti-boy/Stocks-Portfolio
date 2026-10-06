import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';
import bcrypt from 'bcryptjs';
import { sendAdminResetPasswordNotification } from '@/lib/email';

declare global {
  // eslint-disable-next-line no-var
  var fallbackUsersStore: any[] | undefined;
}

export async function POST(req: Request) {
  try {
    const { adminUserId, adminRole, targetUserId, targetEmail, newPassword, requirePasswordChangeOnLogin } = await req.json();

    // Verify Admin privilege
    if (adminRole !== 'ADMIN' && adminUserId !== 'admin_master') {
      return NextResponse.json({ error: 'Unauthorized. Password reset requires Admin access.' }, { status: 403 });
    }

    if (!newPassword || newPassword.length < 4) {
      return NextResponse.json({ error: 'New password must be at least 4 characters long' }, { status: 400 });
    }

    if (!targetUserId && !targetEmail) {
      return NextResponse.json({ error: 'Target user ID or email is required' }, { status: 400 });
    }

    const cleanTargetEmail = targetEmail ? targetEmail.toLowerCase().trim() : '';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    const mustChange = requirePasswordChangeOnLogin !== false;

    let targetName = 'User';
    let targetActualEmail = cleanTargetEmail;
    let isUpdated = false;

    const db = await connectToDatabase();

    // 1. Update in MongoDB Atlas Cloud DB
    if (db && db.connection.readyState === 1) {
      try {
        let user;
        if (targetUserId && targetUserId !== 'admin_master' && !targetUserId.startsWith('usr_')) {
          user = await UserModel.findById(targetUserId);
        } else if (cleanTargetEmail) {
          user = await UserModel.findOne({ email: cleanTargetEmail });
        }

        if (user) {
          user.passwordHash = passwordHash;
          user.mustChangePassword = mustChange;
          await user.save();

          targetName = user.name;
          targetActualEmail = user.email;
          isUpdated = true;
        }
      } catch (dbErr: any) {
        console.warn('MongoDB admin password reset error:', dbErr.message);
      }
    }

    // 2. Also update in Fallback Store
    if (global.fallbackUsersStore) {
      const fbUser = global.fallbackUsersStore.find(
        (u) => u.id === targetUserId || (cleanTargetEmail && u.email === cleanTargetEmail)
      );

      if (fbUser) {
        fbUser.passwordHash = passwordHash;
        fbUser.mustChangePassword = mustChange;
        targetName = fbUser.name;
        targetActualEmail = fbUser.email;
        isUpdated = true;
      }
    }

    // Send email notification to user from 51manoj2004@gmail.com
    await sendAdminResetPasswordNotification(targetActualEmail, targetName, newPassword);

    return NextResponse.json({
      success: true,
      message: `Password for ${targetName} (${targetActualEmail}) has been reset by Admin and updated credentials emailed.`,
    });
  } catch (err: any) {
    console.error('Admin password reset error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to reset user password' }, { status: 500 });
  }
}
