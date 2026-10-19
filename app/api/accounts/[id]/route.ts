import { NextRequest, NextResponse } from 'next/server';
import { connectDb } from '@/lib/db';
import User from '@/models/User';
import { requireRole } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(request, ['admin']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDb();

    const { id } = await params;
    const body = await request.json();
    const { username, password, role } = body;

    if (!username) {
      return NextResponse.json(
        { message: 'Username is required' },
        { status: 400 }
      );
    }

    if (role && !['admin', 'enterer'].includes(role)) {
      return NextResponse.json(
        { message: 'Invalid role' },
        { status: 400 }
      );
    }

    const session = authResult;

    // Find the user being edited
    const userToEdit = await User.findById(id);
    if (!userToEdit) {
      return NextResponse.json(
        { message: 'Account not found' },
        { status: 404 }
      );
    }

    // Prevent non-admin from setting admin role
    if (role === 'admin' && session.role !== 'admin') {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      );
    }

    // Check if this is the last admin and trying to demote
    if (userToEdit.role === 'admin' && role === 'enterer') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return NextResponse.json(
          { message: 'Cannot demote the last admin' },
          { status: 409 }
        );
      }
    }

    // Check for duplicate username
    if (username !== userToEdit.UserName) {
      const existingUser = await User.findOne({ UserName: username });
      if (existingUser) {
        return NextResponse.json(
          { message: 'Username already exists' },
          { status: 409 }
        );
      }
    }

    // Build update object
    const updateData: any = {
      UserName: username,
    };

    if (role) {
      updateData.role = role;
    }

    // Hash password if provided
    if (password && password.trim() !== '') {
      updateData.Password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { message: 'Failed to update account' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Account updated successfully',
        user: {
          id: updatedUser._id.toString(),
          username: updatedUser.UserName,
          role: updatedUser.role,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating account:', error);

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(request, ['admin']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDb();

    const { id } = await params;

    const userToDelete = await User.findById(id);
    if (!userToDelete) {
      return NextResponse.json(
        { message: 'Account not found' },
        { status: 404 }
      );
    }

    // Check if this is the last admin
    if (userToDelete.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return NextResponse.json(
          { message: 'Cannot delete the last admin' },
          { status: 409 }
        );
      }
    }

    await User.findByIdAndDelete(id);

    return NextResponse.json(
      { message: 'Account deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
