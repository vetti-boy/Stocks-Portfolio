import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';
import { getAuthedAdmin } from '@/lib/session';
import { MASTER_ADMIN_EMAIL } from '@/lib/config';


export async function GET(req: Request) {
  try {
    if (!(await getAuthedAdmin(req))) {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 403 });
    }

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
    }

    // Auto-seed Master Admin into MongoDB Cloud DB if not present
    const masterAdminInMongo = await UserModel.findOne({ email: MASTER_ADMIN_EMAIL });
    if (!masterAdminInMongo) {
      await UserModel.create({
        name: 'System Administrator',
        email: MASTER_ADMIN_EMAIL,
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
