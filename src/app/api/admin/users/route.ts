import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';

declare global {
  // eslint-disable-next-line no-var
  var fallbackUsersStore: any[] | undefined;
}

const DEFAULT_ADMIN_RECORDS = [
  {
    id: 'admin_master',
    name: 'System Administrator',
    email: 'mailfortempusage@gmail.com',
    passwordHash: '$2b$10$DpNsqZkqyTzKtl7tCL5lY.CNNt7B0345xZ3AkwvNyfJg5nyClxBu.', // PasswordForAdmin@123!@#
    role: 'ADMIN',
    currency: 'INR',
    mustChangePassword: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user_default',
    name: 'Manoj S',
    email: '51manoj2004@gmail.com',
    passwordHash: '$2b$10$DpNsqZkqyTzKtl7tCL5lY.CNNt7B0345xZ3AkwvNyfJg5nyClxBu.', // PasswordForAdmin@123!@#
    role: 'USER',
    currency: 'INR',
    mustChangePassword: false,
    createdAt: new Date().toISOString(),
  },
];

if (!global.fallbackUsersStore) {
  global.fallbackUsersStore = DEFAULT_ADMIN_RECORDS;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const adminRole = searchParams.get('adminRole');

    if (adminRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 403 });
    }

    if (!global.fallbackUsersStore || global.fallbackUsersStore.length === 0) {
      global.fallbackUsersStore = DEFAULT_ADMIN_RECORDS;
    }

    const fallbackList = global.fallbackUsersStore.map(({ passwordHash, ...rest }) => rest);

    const db = await connectToDatabase();
    if (db && db.connection.readyState === 1) {
      try {
        // Auto-seed Master Admin into MongoDB Cloud DB if not present
        const masterAdminInMongo = await UserModel.findOne({ email: 'mailfortempusage@gmail.com' });
        if (!masterAdminInMongo) {
          await UserModel.create({
            name: 'System Administrator',
            email: 'mailfortempusage@gmail.com',
            passwordHash: '$2b$10$DpNsqZkqyTzKtl7tCL5lY.CNNt7B0345xZ3AkwvNyfJg5nyClxBu.',
            role: 'ADMIN',
            currency: 'INR',
            mustChangePassword: false,
          });
        }

        // Auto-seed Manoj S default user into MongoDB Cloud DB if not present
        const defaultUserInMongo = await UserModel.findOne({ email: '51manoj2004@gmail.com' });
        if (!defaultUserInMongo) {
          await UserModel.create({
            name: 'Manoj S',
            email: '51manoj2004@gmail.com',
            passwordHash: '$2b$10$DpNsqZkqyTzKtl7tCL5lY.CNNt7B0345xZ3AkwvNyfJg5nyClxBu.',
            role: 'USER',
            currency: 'INR',
            mustChangePassword: false,
          });
        }

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
