import { SignJWT, jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export interface SessionPayload {
  userId: string;
  username: string;
  role: 'admin' | 'enterer';
  iat?: number;
  exp?: number;
}

export async function createSession(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ 
    userId: payload.userId, 
    username: payload.username, 
    role: payload.role 
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('12h')
    .sign(JWT_SECRET);
}

export async function getSession(request: NextRequest): Promise<SessionPayload | null> {
  const token = request.cookies.get('session')?.value;
  
  if (!token) {
    return null;
  }

  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as unknown as SessionPayload;
  } catch (error) {
    return null;
  }
}

export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  
  if (!token) {
    return null;
  }

  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as unknown as SessionPayload;
  } catch (error) {
    return null;
  }
}

export async function requireRole(
  request: NextRequest,
  allowedRoles: Array<'admin' | 'enterer'>
): Promise<SessionPayload | NextResponse> {
  const session = await getSession(request);

  if (!session) {
    return NextResponse.json(
      { message: 'Unauthorized' },
      { status: 401 }
    );
  }

  if (!allowedRoles.includes(session.role)) {
    return NextResponse.json(
      { message: 'Forbidden' },
      { status: 403 }
    );
  }

  return session;
}
