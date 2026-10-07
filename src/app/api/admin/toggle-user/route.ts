import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';

declare global {
  // eslint-disable-next-line no-var
  var fallbackUsersStore: any[] | undefined;
}

export async function POST(req: Request) {
  try {
    const { targetUserId, isDisabled, adminRole } = await req.json();

    if (adminRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 403 });
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
    }

    if (targetUserId === 'admin_master') {
      return NextResponse.json({ error: 'Master Admin account status cannot be modified.' }, { status: 400 });
    }

    await connectToDatabase();

    // Block disabling any Admin account in MongoDB
    const existingUser = await UserModel.findById(targetUserId);
    if (existingUser && (existingUser.role === 'ADMIN' || existingUser.email === 'mailfortempusage@gmail.com')) {
      return NextResponse.json({ error: 'Administrator accounts cannot be disabled.' }, { status: 400 });
    }

    // Try updating MongoDB User model
    try {
      const updatedUser = await UserModel.findByIdAndUpdate(
        targetUserId,
        { isDisabled: !!isDisabled },
        { new: true }
      );
      if (updatedUser) {
        return NextResponse.json({
          success: true,
          message: `User account ${isDisabled ? 'disabled' : 'enabled'} successfully.`,
          user: updatedUser,
        });
      }
    } catch (err: any) {
      console.warn('MongoDB toggle-user search/update failed:', err.message);
    }

    // Update fallback store if present
    if (global.fallbackUsersStore) {
      const fbUser = global.fallbackUsersStore.find((u) => u.id === targetUserId);
      if (fbUser) {
        fbUser.isDisabled = !!isDisabled;
        return NextResponse.json({
          success: true,
          message: `User account ${isDisabled ? 'disabled' : 'enabled'} successfully (fallback).`,
          user: fbUser,
        });
      }
    }

    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  } catch (err: any) {
    console.error('Toggle user status error:', err);
    return NextResponse.json({ error: 'Failed to update user account status' }, { status: 500 });
  }
}
