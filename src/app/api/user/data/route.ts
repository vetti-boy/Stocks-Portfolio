import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserDataModel } from '@/models/UserData';
import { encryptPayload, decryptPayload } from '@/lib/encryption';

// SAVE (ENCRYPT & WRITE TO CLOUD DB)
export async function POST(req: Request) {
  try {
    const { userId, userEmail, holdings, watchlist, tradeHistory, taxSettings } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // 1. Prepare raw payload JSON object
    const rawPayload = { holdings, watchlist, tradeHistory, taxSettings, updatedAt: new Date().toISOString() };

    // 2. ENCRYPT server-side using AES-256-GCM
    const encryptedString = encryptPayload(rawPayload);

    // 3. STORE in MongoDB Cloud DB in encrypted format
    await connectToDatabase();

    await UserDataModel.findOneAndUpdate(
      { userId },
      {
        userId,
        userEmail: userEmail || 'user@stocks.io',
        encryptedPayload: encryptedString,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Portfolio holdings encrypted using AES-256-GCM and saved to Cloud DB successfully.',
      encryptedSnippet: encryptedString.slice(0, 30) + '...',
    });
  } catch (err: any) {
    console.error('Save encrypted data error:', err);
    return NextResponse.json({ error: 'Failed to encrypt and store data in cloud DB.' }, { status: 500 });
  }
}

// FETCH (READ FROM CLOUD DB & DECRYPT IN APPLICATION)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId query parameter is required' }, { status: 400 });
    }

    await connectToDatabase();

    const record = await UserDataModel.findOne({ userId });
    if (!record || !record.encryptedPayload) {
      return NextResponse.json({ data: null, message: 'No stored cloud data found for user' });
    }

    // DECRYPT AES-256-GCM encrypted payload back to application format
    const decryptedData = decryptPayload(record.encryptedPayload);

    return NextResponse.json({
      success: true,
      data: decryptedData,
      isEncryptedSource: true,
    });
  } catch (err: any) {
    console.error('Fetch and decrypt error:', err);
    return NextResponse.json({ error: 'Failed to fetch and decrypt data from cloud DB.' }, { status: 500 });
  }
}
