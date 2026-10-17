import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import PreAttendance from "@/models/PreAttendence";
import SmkDetail from "@/models/SmkDetail";
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

    if (searchParams.get("missing") === "smk") {
      const ravisabhaObjectId = new mongoose.Types.ObjectId(ravisabhaId);
      const marked = await PreAttendance.find({
        ravisabhaId: ravisabhaObjectId,
        $or: [
          { smkDetailId: { $exists: true, $ne: null } },
          { SmkId: { $exists: true, $nin: [null, ""] } },
        ],
      })
        .select("smkDetailId SmkId")
        .lean();

      const markedIds = marked
        .map((record) => record.smkDetailId)
        .filter((id): id is NonNullable<typeof id> => Boolean(id));
      const markedSmkIds = marked
        .map((record) => record.SmkId)
        .filter((id): id is string => Boolean(id));

      const users = await SmkDetail.find({
        _id: { $nin: markedIds },
        ...(markedSmkIds.length > 0 ? { SmkId: { $nin: markedSmkIds } } : {}),
      })
        .sort({ KutumbId: 1, SmkId: 1, FirstName: 1 })
        .lean();

      return NextResponse.json({ users }, { status: 200 });
    }

    const populateSmk = searchParams.get("populate") === "smk";
    let preAttendanceQuery = PreAttendance.find({
      ravisabhaId: new mongoose.Types.ObjectId(ravisabhaId),
    });
    if (populateSmk) {
      preAttendanceQuery = preAttendanceQuery.populate("smkDetailId");
    }
    const records = await preAttendanceQuery.lean();

    const isPresentSmkRecord = (record: { smkDetailId?: unknown; SmkId?: string; status?: string }) =>
      record.status !== "Absent" && Boolean(record.smkDetailId || record.SmkId);

    const smkCount = records.filter(isPresentSmkRecord).length;
    const totalMehman = records.reduce((sum, r) => sum + (r.mehmanCount ?? 0), 0);
    const totalFamily = records.reduce((sum, r) => sum + (r.familyCount ?? 0), 0);

    return NextResponse.json(
      { records, smkCount, totalMehman, totalFamily },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching pre-attendance:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
