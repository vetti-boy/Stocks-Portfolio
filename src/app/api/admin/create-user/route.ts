import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';

export async function POST(req: Request) {
  try {
    const { adminUserId, adminRole, name, email, role, currency } = await req.json();

    // Verify requesting user is an Admin
    if (adminRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Account provisioning is restricted strictly to Admin users.' },
        { status: 403 }
      );
    }

    if (!email || !name) {
      return NextResponse.json({ error: 'Name and Google email are required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();

    await connectToDatabase();

    const existingUser = await UserModel.findOne({ email: cleanEmail });
    if (existingUser) {
      return NextResponse.json({ error: 'User account with this email already exists' }, { status: 409 });
    }

    const newUser = await UserModel.create({
      name: cleanName,
      email: cleanEmail,
      role: role || 'USER',
      currency: currency || 'INR',
      createdByAdminId: adminUserId,
      isDisabled: false,
    });

    return NextResponse.json({
      success: true,
      message: `User account created successfully for ${cleanName} (${cleanEmail}).`,
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        currency: newUser.currency,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Admin user creation error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to create user account' }, { status: 500 });
  }
}
