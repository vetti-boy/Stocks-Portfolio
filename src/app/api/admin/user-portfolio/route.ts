import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';
import { getAuthedAdmin } from '@/lib/session';

import { UserDataModel } from '@/models/UserData';
import { decryptPayload } from '@/lib/encryption';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('targetUserId');

    // Strict authorization: Only Admin users can inspect other users' portfolios
    if (!(await getAuthedAdmin(req))) {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 403 });
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
    }

    await connectToDatabase();

    const targetUser = await UserModel.findById(targetUserId);

    const record = await UserDataModel.findOne({
      $or: [
        { userId: targetUserId },
        ...(targetUser?.email ? [{ userEmail: targetUser.email }] : []),
      ],
    });

    if (!record || (!record.payload && !record.encryptedPayload)) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No portfolio holdings data uploaded yet by this user.',
      });
    }

    const data = record.payload || decryptPayload(record.encryptedPayload);

    return NextResponse.json({
      success: true,
      targetUserId,
      userEmail: record.userEmail,
      updatedAt: record.updatedAt,
      data,
    });
  } catch (err: any) {
    console.error('Admin fetch user portfolio error:', err);
    return NextResponse.json({ error: 'Failed to retrieve user portfolio data.' }, { status: 500 });
  }
}
