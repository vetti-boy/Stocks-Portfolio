import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserDataModel } from '@/models/UserData';
import { decryptPayload } from '@/lib/encryption';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const adminRole = searchParams.get('adminRole');
    const adminUserId = searchParams.get('adminUserId');
    const targetUserId = searchParams.get('targetUserId');

    // Strict authorization: Only Admin users can inspect other users' portfolios
    if (adminRole !== 'ADMIN' && adminUserId !== 'admin_master') {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 403 });
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
    }

    await connectToDatabase();

    const record = await UserDataModel.findOne({ userId: targetUserId });
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
