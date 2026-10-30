import { NextResponse } from 'next/server';
import { getAuthedUser, unauthorized } from '@/lib/session';

/** Returns the user behind the current session cookie (authoritative role / disabled state). */
export async function GET(req: Request) {
  const user = await getAuthedUser(req);
  if (!user) return unauthorized();

  return NextResponse.json({
    success: true,
    user: {
      id: user._id.toString(),
      googleId: user.googleId,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      currency: user.currency || 'INR',
      isDisabled: false,
    },
  });
}
