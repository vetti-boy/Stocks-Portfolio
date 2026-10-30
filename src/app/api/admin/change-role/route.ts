import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';
import { getAuthedAdmin } from '@/lib/session';
import { isMasterAdminEmail } from '@/lib/config';


declare global {
  // eslint-disable-next-line no-var
  var fallbackUsersStore: any[] | undefined;
}

export async function POST(req: Request) {
  try {
    const { targetUserId, newRole } = await req.json();

    if (!(await getAuthedAdmin(req))) {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 403 });
    }

    if (!targetUserId || !newRole) {
      return NextResponse.json({ error: 'targetUserId and newRole are required' }, { status: 400 });
    }

    if (!['ADMIN', 'USER'].includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role specified. Must be ADMIN or USER.' }, { status: 400 });
    }

    // Protect master admin from having their role changed
    if (targetUserId === 'admin_master') {
      return NextResponse.json({ error: 'Master Admin role cannot be changed' }, { status: 400 });
    }

    await connectToDatabase();

    // Prevent changing Master Admin email
    const existingUser = await UserModel.findById(targetUserId);
    if (existingUser && isMasterAdminEmail(existingUser.email)) {
      return NextResponse.json({ error: 'System Administrator role cannot be demoted.' }, { status: 400 });
    }

    // Update MongoDB UserModel
    try {
      const updatedUser = await UserModel.findByIdAndUpdate(
        targetUserId,
        { role: newRole },
        { new: true }
      );

      if (updatedUser) {
        return NextResponse.json({
          success: true,
          message: `User ${updatedUser.name} role changed to ${newRole} successfully.`,
          user: updatedUser,
        });
      }
    } catch (err: any) {
      console.warn('MongoDB role change query failed:', err.message);
    }

    // Update fallback store if present
    if (global.fallbackUsersStore) {
      const fbUser = global.fallbackUsersStore.find((u) => u.id === targetUserId);
      if (fbUser) {
        fbUser.role = newRole;
        return NextResponse.json({
          success: true,
          message: `User role changed to ${newRole} successfully (fallback).`,
          user: fbUser,
        });
      }
    }

    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  } catch (err: any) {
    console.error('Change user role error:', err);
    return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
  }
}
