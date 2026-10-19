import { NextRequest, NextResponse } from 'next/server';
import { connectDb } from '@/lib/db';
import User from '@/models/User';
import { requireRole } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  const authResult = await requireRole(request, ['admin']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDb();

    const users = await User.find()
      .select('-Password')
      .sort({ createdAt: -1 })
      .lean();

    const formattedUsers = users.map((user: any) => ({
      id: user._id.toString(),
      username: user.UserName,
      role: user.role || 'enterer',
      createdAt: user.createdAt,
    }));

    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireRole(request, ['admin']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDb();

    const body = await request.json();
    const { username, password, role } = body;

    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username and password are required' },
        { status: 400 }
      );
    }

    if (!role || !['admin', 'enterer'].includes(role)) {
      return NextResponse.json(
        { message: 'Valid role is required' },
        { status: 400 }
      );
    }

    // Only admin can create admin accounts
    const session = authResult;
    if (role === 'admin' && session.role !== 'admin') {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      );
    }

    // Check if username already exists
    const existingUser = await User.findOne({ UserName: username });
    if (existingUser) {
      return NextResponse.json(
        { message: 'Username already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await User.create({
      UserName: username,
      Password: hashedPassword,
      role: role,
    });

    return NextResponse.json(
      {
        message: 'Account created successfully',
        user: {
          id: newUser._id.toString(),
          username: newUser.UserName,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating account:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { message: 'Username already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
