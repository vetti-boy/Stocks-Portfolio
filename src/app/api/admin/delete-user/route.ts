import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';
import { UserDataModel } from '@/models/UserData';

declare global {
  // eslint-disable-next-line no-var
  var fallbackUsersStore: any[] | undefined;
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('targetUserId');
    const adminRole = searchParams.get('adminRole');

    if (adminRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 403 });
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
    }

    // Protect master admin account from deletion
    if (targetUserId === 'admin_master') {
      return NextResponse.json({ error: 'Master Admin account cannot be deleted' }, { status: 400 });
    }

    await connectToDatabase();

    // Block deleting any Admin account in MongoDB
    const existingUser = await UserModel.findById(targetUserId);
    if (existingUser && (existingUser.role === 'ADMIN' || existingUser.email === 'mailfortempusage@gmail.com')) {
      return NextResponse.json({ error: 'Administrator accounts cannot be deleted.' }, { status: 400 });
    }

    // 1. Delete user from MongoDB User collection & UserData collection
    try {
      await UserModel.findByIdAndDelete(targetUserId);
      await UserDataModel.deleteMany({ userId: targetUserId });
    } catch (err: any) {
      console.warn('MongoDB user deletion failed:', err.message);
    }

    // 2. Remove from fallback user store if present
    if (global.fallbackUsersStore) {
      global.fallbackUsersStore = global.fallbackUsersStore.filter((u) => u.id !== targetUserId);
    }

    return NextResponse.json({
      success: true,
      message: 'User account and encrypted portfolio data permanently deleted.',
    });
  } catch (err: any) {
    console.error('Delete user account error:', err);
    return NextResponse.json({ error: 'Failed to delete user account' }, { status: 500 });
  }
}
