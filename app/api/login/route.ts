import { NextResponse } from "next/server";
import User from "@/models/User";
import mongoose from "mongoose";
import { connectDb } from "@/lib/db";

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

    if (user.Password !== password) {
      return NextResponse.json(
        { message: "Invalid username or password" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { 
        message: "Login successful",
        user: {
          id: user._id,
          username: user.UserName
        }
      },
      { status: 200 }
    );

  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
