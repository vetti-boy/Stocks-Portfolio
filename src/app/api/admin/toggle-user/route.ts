import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';
import { getAuthedAdmin } from '@/lib/session';
import { isMasterAdminEmail } from '@/lib/config';


export async function POST(req: Request) {
  try {
    const { targetUserId, isDisabled } = await req.json();

    if (!(await getAuthedAdmin(req))) {
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

    if (isMasterAdminEmail(existingUser.email)) {
      return NextResponse.json({ error: 'Master Administrator account cannot be disabled.' }, { status: 400 });
    }

    existingUser.isDisabled = Boolean(isDisabled);
    await existingUser.save();

    return NextResponse.json({
      success: true,
      message: `User account ${isDisabled ? 'disabled' : 'enabled'} successfully.`,
      user: {
        id: existingUser._id.toString(),
        name: existingUser.name,
        email: existingUser.email,
        isDisabled: existingUser.isDisabled,
      },
    });
  } catch (err: any) {
    console.error('Toggle user status error:', err);
    return NextResponse.json({ error: 'Failed to update user account status' }, { status: 500 });
  }
}
