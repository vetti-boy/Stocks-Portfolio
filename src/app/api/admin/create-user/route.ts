import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';
import bcrypt from 'bcryptjs';
import { sendNewUserWelcomeEmail } from '@/lib/email';

declare global {
  // eslint-disable-next-line no-var
  var fallbackUsersStore: any[] | undefined;
}

if (!global.fallbackUsersStore) {
  global.fallbackUsersStore = [
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
      id: 'admin_legacy',
      name: 'System Administrator Legacy',
      email: '51manoj2004@gmail.com',
      passwordHash: '$2b$10$DpNsqZkqyTzKtl7tCL5lY.CNNt7B0345xZ3AkwvNyfJg5nyClxBu.', // PasswordForAdmin@123!@#
      role: 'ADMIN',
      currency: 'INR',
      mustChangePassword: false,
      createdAt: new Date().toISOString(),
    },
  ];
}

export async function POST(req: Request) {
  try {
    const { adminUserId, adminRole, name, email, password, role, currency } = await req.json();

    // STRICT CHECK: Verify requesting user is an Admin
    if (adminRole !== 'ADMIN' && adminUserId !== 'admin_master') {
      return NextResponse.json(
        { error: 'Unauthorized. Account creation is restricted strictly to Admin users.' },
        { status: 403 }
      );
    }

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Name, email, and default password are required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPassword = String(password).trim();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(cleanPassword, salt);

    const db = await connectToDatabase();

    if (db && db.connection.readyState === 1) {
      const existingUser = await UserModel.findOne({ email: cleanEmail });
      if (existingUser) {
        return NextResponse.json({ error: 'User account with this email already exists' }, { status: 409 });
      }

      try {
        const newUser = await UserModel.create({
          name: name.trim(),
          email: cleanEmail,
          passwordHash,
          role: role || 'USER',
          currency: currency || 'INR',
          createdByAdminId: adminUserId,
          mustChangePassword: true, // MANDATORY FIRST LOGIN PASSWORD CHANGE REQUIREMENT
        });

        // Also add to fallback store for sync
        global.fallbackUsersStore?.push({
          id: newUser._id.toString(),
          name: newUser.name,
          email: cleanEmail,
          passwordHash,
          role: newUser.role,
          currency: newUser.currency,
          mustChangePassword: true,
          createdAt: newUser.createdAt,
        });

        sendNewUserWelcomeEmail(cleanEmail, name, cleanPassword).catch((e) => console.warn(e));

        return NextResponse.json({
          message: 'New user account created successfully in MongoDB Atlas. Credentials sent to user email.',
          user: {
            id: newUser._id.toString(),
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            currency: newUser.currency,
            mustChangePassword: true,
            createdAt: newUser.createdAt,
          },
        });
      } catch (dbErr: any) {
        console.error('MongoDB user creation error:', dbErr);
        if (dbErr.code === 11000 || dbErr.message?.includes('duplicate key')) {
          return NextResponse.json({ error: 'User account with this email already exists' }, { status: 409 });
        }
        return NextResponse.json({ error: dbErr.message || 'Failed to create user account in database' }, { status: 500 });
      }
    }

    // Fallback store handling (when MongoDB is offline/local mode)
    const existingFallback = global.fallbackUsersStore?.find((u) => u.email === cleanEmail);
    if (existingFallback) {
      return NextResponse.json({ error: 'User account with this email already exists' }, { status: 409 });
    }

    const fallbackUser = {
      id: 'usr_' + Date.now(),
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role: role || 'USER',
      currency: currency || 'INR',
      mustChangePassword: true,
      createdAt: new Date().toISOString(),
    };

    global.fallbackUsersStore?.push(fallbackUser);

    sendNewUserWelcomeEmail(cleanEmail, name, cleanPassword).catch((e) => console.warn(e));

    return NextResponse.json({
      message: 'New user account created successfully. Credentials sent to user email.',
      user: {
        id: fallbackUser.id,
        name: fallbackUser.name,
        email: fallbackUser.email,
        role: fallbackUser.role,
        currency: fallbackUser.currency,
        mustChangePassword: true,
        createdAt: fallbackUser.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Admin user creation error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to create user account' }, { status: 500 });
  }
}
