import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import Attendance from "@/models/Attendance";
import mongoose from "mongoose";

export async function GET(request: Request) {
  try {
    await connectDb();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const ravisabhaId = searchParams.get("ravisabhaId");

    let matchStage: any = {};

    if (ravisabhaId) {
      if (mongoose.Types.ObjectId.isValid(ravisabhaId)) {
        matchStage.ravisabhaId = new mongoose.Types.ObjectId(ravisabhaId);
      }
    } else if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      matchStage.date = { $gte: startDate, $lte: endDate };
    } else {
      return NextResponse.json(
        { message: "Date or RavisabhaId required" },
        { status: 400 }
      );
    }

    const stats = await Attendance.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "smkdetails",
          localField: "smkDetailId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $group: {
          _id: "$user.Gender",
          count: { $sum: 1 },
        },
      },
    ]);

    let male = 0;
    let female = 0;
    let total = 0;

    stats.forEach((stat) => {
      const gender = stat._id?.toString();
      const count = stat.count;
      total += count;
      // Check for both number (1/2) and string representations if any
      if (gender === "1" || gender === "Male" || gender === "male") {
        male += count;
      } else if (gender === "2" || gender === "Female" || gender === "female") {
        female += count;
      }
    });

    return NextResponse.json({ male, female, total });
  } catch (error) {
    console.error("Error fetching attendance stats:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
