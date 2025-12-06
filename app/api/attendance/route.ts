import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import Attendance from "@/models/Attendance";
// Import all models to ensure they are registered (needed for populate)
import "@/models";

export async function POST(request: Request) {
  try {
    await connectDb();

    const body = await request.json();
    const { smkDetailId, userId, SmkId, name, status, remarks } = body;

    if (!smkDetailId || !userId || !SmkId) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const newAttendance = new Attendance({
      smkDetailId,
      userId,
      SmkId,
      name,
      status: status || "absent",
      remarks,
    });

    await newAttendance.save();

    return NextResponse.json(
      { message: "Attendance saved successfully", attendance: newAttendance },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving attendance:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    await connectDb();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    let queryStartDate: Date;
    let queryEndDate: Date;

    if (startDateParam && endDateParam) {
      queryStartDate = new Date(startDateParam);
      queryStartDate.setHours(0, 0, 0, 0);
      
      queryEndDate = new Date(endDateParam);
      queryEndDate.setHours(23, 59, 59, 999);
    } else if (date) {
      queryStartDate = new Date(date);
      queryStartDate.setHours(0, 0, 0, 0);
      
      queryEndDate = new Date(date);
      queryEndDate.setHours(23, 59, 59, 999);
    } else {
      return NextResponse.json(
        { message: "Date or Date Range parameters are required" },
        { status: 400 }
      );
    }

    const records = await Attendance.find({
      date: {
        $gte: queryStartDate,
        $lte: queryEndDate,
      },
    })
    .populate("smkDetailId") // Populate user details if needed
    .sort({ date: -1 });

    return NextResponse.json({ records }, { status: 200 });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await connectDb();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "Record ID is required" },
        { status: 400 }
      );
    }

    const deletedRecord = await Attendance.findByIdAndDelete(id);

    if (!deletedRecord) {
      return NextResponse.json(
        { message: "Record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Record deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting attendance:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
