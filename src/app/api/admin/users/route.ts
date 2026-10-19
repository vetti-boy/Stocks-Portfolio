import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const adminRole = searchParams.get('adminRole');

    if (adminRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 403 });
    }

    await connectToDatabase();

    // Auto-seed Master Admin into MongoDB Cloud DB if not present
    const masterAdminInMongo = await UserModel.findOne({ email: 'mailfortempusage@gmail.com' });
    if (!masterAdminInMongo) {
      await UserModel.create({
        name: 'System Administrator',
        email: 'mailfortempusage@gmail.com',
        role: 'ADMIN',
        currency: 'INR',
        isDisabled: false,
      });
    }

    const mongoUsers = await UserModel.find({}, '-passwordHash').sort({ createdAt: -1 });
    const userList = mongoUsers.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      avatar: u.avatar,
      role: u.role,
      currency: u.currency || 'INR',
      isDisabled: Boolean(u.isDisabled),
      createdAt: u.createdAt,
    }));

    return NextResponse.json({
      users: userList,
      totalCount: userList.length,
      mongoCount: userList.length,
    });
  } catch (err: any) {
    console.error('Fetch users error:', err);
    return NextResponse.json({ error: 'Failed to fetch user directory' }, { status: 500 });
  }
}
