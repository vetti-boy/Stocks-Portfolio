import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';

declare global {
  // eslint-disable-next-line no-var
  var fallbackUsersStore: any[] | undefined;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const adminRole = searchParams.get('adminRole');

    if (adminRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 403 });
    }

    const fallbackList = (global.fallbackUsersStore || []).map(({ passwordHash, ...rest }) => rest);

    const db = await connectToDatabase();
    if (db && db.connection.readyState === 1) {
      try {
        const mongoUsers = await UserModel.find({}, '-passwordHash').sort({ createdAt: -1 });
        const mongoList = mongoUsers.map((u) => ({
          id: u._id.toString(),
          name: u.name,
          email: u.email,
          role: u.role,
          currency: u.currency,
          isDisabled: u.isDisabled || false,
          createdAt: u.createdAt,
        }));

        // Merge lists avoiding duplicates by email
        const combined = [...mongoList];
        fallbackList.forEach((fbUser) => {
          if (!combined.some((u) => u.email === fbUser.email)) {
            combined.push(fbUser);
          }
        });

        return NextResponse.json({
          users: combined,
          totalCount: combined.length,
          mongoCount: mongoList.length,
          fallbackCount: fallbackList.length,
        });
      } catch (err: any) {
        console.warn('MongoDB user list query failed, using fallback list:', err.message);
      }
    }

    return NextResponse.json({
      users: fallbackList,
      totalCount: fallbackList.length,
      mongoCount: 0,
      fallbackCount: fallbackList.length,
    });
  } catch (err: any) {
    console.error('Fetch users error:', err);
    return NextResponse.json({ error: 'Failed to fetch user directory' }, { status: 500 });
  }
}
