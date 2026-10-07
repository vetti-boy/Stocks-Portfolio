import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserDataModel } from '@/models/UserData';
import { decryptPayload } from '@/lib/encryption';

// SAVE (STORE USER PORTFOLIO DATA DIRECTLY IN DATABASE)
export async function POST(req: Request) {
  try {
    const { userId, userEmail, holdings, watchlist, tradeHistory, taxSettings } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const payload = { holdings, watchlist, tradeHistory, taxSettings, updatedAt: new Date().toISOString() };

    await connectToDatabase();

    await UserDataModel.findOneAndUpdate(
      { userId },
      {
        userId,
        userEmail: userEmail || 'user@stocks.io',
        payload,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Portfolio holdings saved successfully.',
    });
  } catch (err: any) {
    console.error('Save user data error:', err);
    return NextResponse.json({ error: 'Failed to store data on server.' }, { status: 500 });
  }
}

// FETCH (READ USER PORTFOLIO DATA FROM DATABASE)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId query parameter is required' }, { status: 400 });
    }

    await connectToDatabase();

    const record = await UserDataModel.findOne({ userId });
    if (!record || (!record.payload && !record.encryptedPayload)) {
      return NextResponse.json({ data: null, message: 'No stored data found for user' });
    }

    const data = record.payload || decryptPayload(record.encryptedPayload);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err: any) {
    console.error('Fetch user data error:', err);
    return NextResponse.json({ error: 'Failed to fetch data from server.' }, { status: 500 });
  }
}
