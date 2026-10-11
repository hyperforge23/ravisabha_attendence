import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import PreAttendance from "@/models/PreAttendence";
import mongoose from "mongoose";
import "@/models";

export async function GET(request: Request) {
  try {
    await connectDb();

    const { searchParams } = new URL(request.url);
    const ravisabhaId = searchParams.get("ravisabhaId");

    if (!ravisabhaId || !mongoose.Types.ObjectId.isValid(ravisabhaId)) {
      return NextResponse.json(
        { message: "Valid ravisabhaId is required" },
        { status: 400 }
      );
    }

    const records = await PreAttendance.find({
      ravisabhaId: new mongoose.Types.ObjectId(ravisabhaId),
    }).lean();

    const totalMehman = records.reduce((sum, r) => sum + (r.mehmanCount ?? 0), 0);
    const totalFamily = records.reduce((sum, r) => sum + (r.familyCount ?? 0), 0);
    const totalEntries = records.length;

    return NextResponse.json(
      { records, totalEntries, totalMehman, totalFamily },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching pre-attendance:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
