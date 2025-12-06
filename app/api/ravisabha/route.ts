import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import RavisabhaDetails from "@/models/RavisabhaDetails";
import Attendance from "@/models/Attendance";
import mongoose from "mongoose";
// Import all models to ensure they are registered
import "@/models";

export async function GET(request: Request) {
  try {
    await connectDb();

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // Format: YYYY-MM
    const year = searchParams.get("year"); // Format: YYYY
    const startDateParam = searchParams.get("startDate"); // Format: ISO date string
    const endDateParam = searchParams.get("endDate"); // Format: ISO date string

    let query: any = {};

    if (startDateParam && endDateParam) {
      // Use date range if provided
      const startDate = new Date(startDateParam);
      const endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999); // Set to end of day

      query.date = {
        $gte: startDate,
        $lte: endDate,
      };
    } else if (month) {
      // Get start and end of the month
      const [yearStr, monthStr] = month.split("-");
      const startDate = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
      const endDate = new Date(parseInt(yearStr), parseInt(monthStr), 0, 23, 59, 59, 999);

      query.date = {
        $gte: startDate,
        $lte: endDate,
      };
    } else if (year) {
      // Get all ravisabhas for the year
      const startDate = new Date(parseInt(year), 0, 1);
      const endDate = new Date(parseInt(year), 11, 31, 23, 59, 59, 999);

      query.date = {
        $gte: startDate,
        $lte: endDate,
      };
    } else {
      // Default: Get current month's ravisabhas
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      query.date = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    const ravisabhas = await RavisabhaDetails.find(query)
      .sort({ date: -1 })
      .lean();

    // Get attendance counts for each ravisabha
    const ravisabhaIds = ravisabhas.map((r: any) => new mongoose.Types.ObjectId(r._id));
    
    const attendanceCounts = await Attendance.aggregate([
      {
        $match: {
          ravisabhaId: { $in: ravisabhaIds }
        }
      },
      {
        $group: {
          _id: "$ravisabhaId",
          count: { $sum: 1 }
        }
      }
    ]);

    // Create a map of ravisabhaId to count
    const countMap = new Map(
      attendanceCounts.map((item: any) => [
        item._id.toString(),
        item.count
      ])
    );

    // Add attendance count to each ravisabha
    const ravisabhasWithCounts = ravisabhas.map((ravisabha: any) => ({
      ...ravisabha,
      attendanceCount: countMap.get(ravisabha._id.toString()) || 0
    }));

    return NextResponse.json({ ravisabhas: ravisabhasWithCounts }, { status: 200 });
  } catch (error) {
    console.error("Error fetching ravisabhas:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDb();

    const body = await request.json();
    const { date, prasad, expense, yajman, notes } = body;

    if (!date) {
      return NextResponse.json(
        { message: "Date is required" },
        { status: 400 }
      );
    }

    const newRavisabha = new RavisabhaDetails({
      date: new Date(date),
      prasad,
      expense: expense ? parseFloat(expense) : undefined,
      yajman,
      notes,
    });

    await newRavisabha.save();

    return NextResponse.json(
      { message: "Ravisabha created successfully", ravisabha: newRavisabha },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating ravisabha:", error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { message: "Ravisabha already exists for this date" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

