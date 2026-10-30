import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';
import { UserDataModel } from '@/models/UserData';

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

    await connectToDatabase();

    const existingUser = await UserModel.findById(targetUserId);
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (existingUser.email === 'mailfortempusage@gmail.com') {
      return NextResponse.json({ error: 'Master Administrator account cannot be deleted.' }, { status: 400 });
    }

    // 1. Delete user from MongoDB User collection
    await UserModel.findByIdAndDelete(targetUserId);

    // 2. Delete all portfolio data linked by userId OR email
    await UserDataModel.deleteMany({
      $or: [{ userId: targetUserId }, { userEmail: existingUser.email }],
    });

    return NextResponse.json({
      success: true,
      message: 'User account and portfolio data permanently deleted from MongoDB.',
    });
  } catch (err: any) {
    console.error('Delete user account error:', err);
    return NextResponse.json({ error: 'Failed to delete user account' }, { status: 500 });
  }
}
