import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import SmkDetail from "@/models/SmkDetail";

export async function GET(request: Request) {
  try {
    await connectDb();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.trim() || "";

    if (query.length < 2) {
      return NextResponse.json({ mainPersons: [] });
    }

    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");
    const numericQuery = Number(query);

    const mainPersons = await SmkDetail.find({
      IsMainPersonInFamily: true,
      KutumbId: { $gte: 100001 },
      $or: [
        { FirstName: regex },
        { MiddleName: regex },
        { LastName: regex },
        { SmkId: regex },
        ...(Number.isFinite(numericQuery)
          ? [{ MobileNo: numericQuery }, { KutumbId: numericQuery }]
          : []),
      ],
    })
      .sort({ KutumbId: 1 })
      .limit(20)
      .lean();

    return NextResponse.json({
      mainPersons: mainPersons.map((person) => ({
        id: String(person._id),
        firstName: person.FirstName,
        middleName: person.MiddleName || "",
        lastName: person.LastName,
        smkNo: person.SmkId,
        mobileNo: person.MobileNo ? String(person.MobileNo) : "",
        kutumbId: person.KutumbId,
        addressDescription: person.AddressDescription || "",
        presentVillageEng: person.PresentVillageEng || "",
      })),
    });
  } catch (error) {
    console.error("Error searching household main persons:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
