import { NextResponse } from "next/server";
import User from "@/models/User";
import { connectDb } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    await connectDb();

    const { username, password } = await request.json();

    const user = await User.findOne({ UserName: username });
    if (!user) {
      return NextResponse.json(
        { message: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Check if password is bcrypt hash or plain text
    const isBcryptHash = user.Password.startsWith('$2a$') || user.Password.startsWith('$2b$');
    let isPasswordValid = false;

    if (isBcryptHash) {
      // Compare with bcrypt
      isPasswordValid = await bcrypt.compare(password, user.Password);
    } else {
      // Plain text comparison for migration
      isPasswordValid = user.Password === password;
      
      // If valid, rehash and save
      if (isPasswordValid) {
        user.Password = await bcrypt.hash(password, 10);
        await user.save();
      }
    }

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Ensure role exists (migration for existing accounts)
    const role = user.role || 'enterer';

    // Create JWT session
    const token = await createSession({
      userId: user._id.toString(),
      username: user.UserName,
      role: role
    });

    const response = NextResponse.json(
      { 
        message: "Login successful",
        user: {
          id: user._id,
          username: user.UserName,
          role: role
        }
      },
      { status: 200 }
    );

    // Set httpOnly cookie
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 12 // 12 hours
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
