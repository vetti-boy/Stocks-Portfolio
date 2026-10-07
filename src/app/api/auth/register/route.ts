import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';
import bcrypt from 'bcryptjs';
import { sendSelfRegistrationConfirmationEmail } from '@/lib/email';

// Global fallback user store when MongoDB is connecting
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
      createdAt: new Date().toISOString(),
    },
  ];
}

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: 'Password must be at least 4 characters long' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const db = await connectToDatabase();

    if (db && db.connection.readyState === 1) {
      // 1. Enforce unique email check in MongoDB Atlas
      const existingUser = await UserModel.findOne({ email: cleanEmail });
      if (existingUser) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please log in.' },
          { status: 409 }
        );
      }

      try {
        const newUser = await UserModel.create({
          name: name.trim(),
          email: cleanEmail,
          passwordHash,
          role: 'USER',
          currency: 'INR',
        });

        // Sync to fallback store
        global.fallbackUsersStore?.push({
          id: newUser._id.toString(),
          name: newUser.name,
          email: cleanEmail,
          passwordHash,
          role: 'USER',
          currency: 'INR',
          createdAt: newUser.createdAt,
        });

        // Send registration confirmation email asynchronously
        sendSelfRegistrationConfirmationEmail(cleanEmail, name).catch((emailErr) => {
          console.warn('Failed to send registration confirmation email:', emailErr.message);
        });

        return NextResponse.json({
          success: true,
          message: 'Account registered successfully!',
          user: {
            id: newUser._id.toString(),
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            currency: newUser.currency,
            isGuest: false,
          },
        });
      } catch (dbErr: any) {
        console.error('MongoDB UserModel.create failed during registration:', dbErr);
        if (dbErr.code === 11000 || dbErr.message?.includes('duplicate key')) {
          return NextResponse.json(
            { error: 'An account with this email already exists. Please log in.' },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { error: 'Failed to create user account in database: ' + (dbErr.message || 'Database error') },
          { status: 500 }
        );
      }
    }

    // Fallback in-memory handling ONLY IF MongoDB connection is down
    const existingFallback = global.fallbackUsersStore?.find((u) => u.email === cleanEmail);
    if (existingFallback) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please log in.' },
        { status: 409 }
      );
    }

    const fallbackUser = {
      id: 'usr_' + Date.now(),
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role: 'USER',
      currency: 'INR',
      createdAt: new Date().toISOString(),
    };

    global.fallbackUsersStore?.push(fallbackUser);

    sendSelfRegistrationConfirmationEmail(cleanEmail, name).catch((emailErr) => {
      console.warn('Failed to send registration confirmation email:', emailErr.message);
    });

    return NextResponse.json({
      success: true,
      message: 'Account registered successfully!',
      user: {
        id: fallbackUser.id,
        name: fallbackUser.name,
        email: fallbackUser.email,
        role: fallbackUser.role,
        currency: fallbackUser.currency,
        isGuest: false,
      },
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to create account' },
      { status: 500 }
    );
  }
}
