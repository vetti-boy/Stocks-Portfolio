import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserDataModel } from '@/models/UserData';
import { decryptPayload } from '@/lib/encryption';

// SAVE (STORE USER PORTFOLIO DATA DIRECTLY IN DATABASE)
export async function POST(req: Request) {
  try {
    const { userId, userEmail, holdings, watchlist, tradeHistory, taxSettings } = await req.json();

    if (!userId && !userEmail) {
      return NextResponse.json({ error: 'userId or userEmail is required' }, { status: 400 });
    }

    const cleanEmail = userEmail ? userEmail.toLowerCase().trim() : '';
    const payload = {
      holdings: Array.isArray(holdings) ? holdings : [],
      watchlist: Array.isArray(watchlist) ? watchlist : [],
      tradeHistory: Array.isArray(tradeHistory) ? tradeHistory : [],
      taxSettings: taxSettings || {},
      updatedAt: new Date().toISOString(),
    };

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json(
        { error: 'MongoDB connection failed. Please ensure 0.0.0.0/0 is allowed in Atlas Network Access.' },
        { status: 503 }
      );
    }

    // Query condition: match by userId OR userEmail
    const queryConditions: any[] = [];
    if (userId) queryConditions.push({ userId });
    if (cleanEmail) queryConditions.push({ userEmail: cleanEmail });

    const query = queryConditions.length > 1 ? { $or: queryConditions } : queryConditions[0];

    await UserDataModel.findOneAndUpdate(
      query,
      {
        userId: userId || cleanEmail,
        userEmail: cleanEmail || 'user@stocks.io',
        payload,
      },
      { upsert: true, returnDocument: 'after' }
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
    const userEmail = searchParams.get('userEmail');

    if (!userId && !userEmail) {
      return NextResponse.json({ error: 'userId or userEmail query parameter is required' }, { status: 400 });
    }

    const cleanEmail = userEmail ? userEmail.toLowerCase().trim() : '';

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json(
        { error: 'MongoDB connection failed. Please ensure 0.0.0.0/0 is allowed in Atlas Network Access.' },
        { status: 503 }
      );
    }

    const queryConditions: any[] = [];
    if (userId) queryConditions.push({ userId });
    if (cleanEmail) queryConditions.push({ userEmail: cleanEmail });

    const query = queryConditions.length > 1 ? { $or: queryConditions } : queryConditions[0];

    const record = await UserDataModel.findOne(query);
    if (!record || (!record.payload && !record.encryptedPayload)) {
      return NextResponse.json({ data: null, message: 'No stored data found for user' });
    }

    const data = record.payload || decryptPayload(record.encryptedPayload);

    // If record was found by email but had an outdated/different userId, keep it in sync
    if (userId && record.userId !== userId) {
      record.userId = userId;
      await record.save().catch((e: any) => console.warn('Failed to sync userId on UserData:', e.message));
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err: any) {
    console.error('Fetch user data error:', err);
    return NextResponse.json({ error: 'Failed to fetch data from server.' }, { status: 500 });
  }
}
