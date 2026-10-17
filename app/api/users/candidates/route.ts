import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDb } from "@/lib/db";
import Attendance from "@/models/Attendance";
import NonSmkCandidate from "@/models/NonSmkCandidate";
import SmkDetail from "@/models/SmkDetail";

const NON_SMK_KUTUMB_MIN = 100001;

export async function GET(request: Request) {
  try {
    await connectDb();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.trim() || "";

    if (query.length < 2) {
      return NextResponse.json({ candidates: [] });
    }

    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");
    const numericQuery = Number(query);
    const candidates = await NonSmkCandidate.find({
      $or: [
        { FirstName: regex },
        { MiddleName: regex },
        { LastName: regex },
        { SmkId: regex },
        ...(Number.isFinite(numericQuery) ? [{ MobileNo: numericQuery }] : []),
      ],
    })
      .limit(20)
      .lean();

    const candidateIds = candidates.map(
      (candidate) => new mongoose.Types.ObjectId(candidate._id)
    );
    const attendanceCounts = await Attendance.aggregate([
      {
        $match: {
          smkDetailId: { $in: candidateIds },
          status: "present",
          ravisabhaId: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: "$smkDetailId",
          ravisabhas: { $addToSet: "$ravisabhaId" },
        },
      },
      {
        $project: {
          count: { $size: "$ravisabhas" },
        },
      },
    ]);
    const countMap = new Map(
      attendanceCounts.map((item) => [String(item._id), item.count])
    );

    let existingKutumbMain = null;
    if (candidates.length === 0) {
      const promoted = await SmkDetail.findOne({
        IsMainPersonInFamily: true,
        KutumbId: { $gte: NON_SMK_KUTUMB_MIN },
        $or: [
          { FirstName: regex },
          { MiddleName: regex },
          { LastName: regex },
          { SmkId: regex },
          ...(Number.isFinite(numericQuery)
            ? [{ MobileNo: numericQuery }, { KutumbId: numericQuery }]
            : []),
        ],
      }).lean();

      if (promoted) {
        existingKutumbMain = {
          id: String(promoted._id),
          firstName: promoted.FirstName,
          middleName: promoted.MiddleName || "",
          lastName: promoted.LastName,
          smkNo: promoted.SmkId,
          mobileNo: promoted.MobileNo ? String(promoted.MobileNo) : "",
          kutumbId: promoted.KutumbId,
          addressDescription: promoted.AddressDescription || "",
        };
      }
    }

    return NextResponse.json({
      existingKutumbMain,
      candidates: candidates.map((candidate) => ({
        id: String(candidate._id),
        firstName: candidate.FirstName,
        middleName: candidate.MiddleName || "",
        lastName: candidate.LastName,
        smkNo: candidate.SmkId,
        mobileNo: candidate.MobileNo ? String(candidate.MobileNo) : "",
        gender: candidate.Gender ? String(candidate.Gender) : "1",
        age: candidate.age || 0,
        presentVillageEng: candidate.PresentVillageEng || "",
        addressDescription: candidate.AddressDescription || "",
        attendanceCount: countMap.get(String(candidate._id)) || 0,
        eligible: (countMap.get(String(candidate._id)) || 0) >= 3,
      })),
    });
  } catch (error) {
    console.error("Error searching Non-SMK candidates:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
