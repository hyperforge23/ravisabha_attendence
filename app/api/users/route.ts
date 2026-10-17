import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import SmkDetail from "@/models/SmkDetail";
import NonSmkCandidate from "@/models/NonSmkCandidate";
import Attendance from "@/models/Attendance";
import { getNextNonSmkKutumbId } from "@/models/Sequence";
import mongoose from "mongoose";

// Helper function to generate SMK ID
// Format: Non_[FirstInitial][MiddleInitial][LastInitial]_[DDMMYYYY]
// Example: Non_PJP_15112025 for "Pulkit Jadishbhai Patel" created on 15-11-2025
function generateSmkId(firstName: string, middleName: string, lastName: string): string {
  const firstInitial = firstName.charAt(0).toUpperCase();
  const middleInitial = middleName ? middleName.charAt(0).toUpperCase() : '';
  const lastInitial = lastName.charAt(0).toUpperCase();
  
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  
  const initials = middleInitial ? `${firstInitial}${middleInitial}${lastInitial}` : `${firstInitial}${lastInitial}`;
  const dateStr = `${day}${month}${year}`;
  
  return `Non_${initials}_${dateStr}`;
}

async function generateUniqueSmkId(
  firstName: string,
  middleName: string,
  lastName: string
) {
  const base = generateSmkId(firstName, middleName, lastName);
  let candidate = base;
  let suffix = 2;
  while (await SmkDetail.exists({ SmkId: candidate })) {
    candidate = `${base}_${suffix}`;
    suffix += 1;
  }
  return candidate;
}

const NON_SMK_KUTUMB_MIN = 100001;

/** Read household fields from MongoDB directly (avoids stale Mongoose schema cache). */
async function readSmkHouseholdFields(mainPersonId: mongoose.Types.ObjectId) {
  const raw = await SmkDetail.collection.findOne(
    { _id: mainPersonId },
    {
      projection: {
        AddressDescription: 1,
        PresentVillageEng: 1,
        MobileNo: 1,
        KutumbId: 1,
      },
    }
  );
  return {
    addressDescription: (raw?.AddressDescription as string) || "",
    presentVillageEng: (raw?.PresentVillageEng as string) || "",
    mobileNo: raw?.MobileNo as number | undefined,
    kutumbId: raw?.KutumbId as number | undefined,
  };
}

async function assertMainPersonKutumbAvailable(
  candidate: { SmkId: string; MobileNo?: number },
  mobileNo: string | undefined,
  session?: mongoose.ClientSession
) {
  const findOne = (filter: Record<string, unknown>) => {
    const query = SmkDetail.findOne(filter);
    return session ? query.session(session) : query;
  };

  const existingSmkMain = await findOne({
    SmkId: candidate.SmkId,
    IsMainPersonInFamily: true,
    KutumbId: { $gte: NON_SMK_KUTUMB_MIN },
  }).lean();
  if (existingSmkMain) {
    throw new Error("KUTUMB_ALREADY_EXISTS_FOR_SMK");
  }

  const finalMobile = mobileNo
    ? parseInt(mobileNo, 10)
    : candidate.MobileNo || 0;
  if (finalMobile > 0) {
    const existingMobileMain = await findOne({
      IsMainPersonInFamily: true,
      KutumbId: { $gte: NON_SMK_KUTUMB_MIN },
      MobileNo: finalMobile,
    }).lean();
    if (existingMobileMain) {
      throw new Error(
        `KUTUMB_ALREADY_EXISTS_FOR_MOBILE:${existingMobileMain.KutumbId}`
      );
    }
  }
}

function formatUser(user: any) {
  return {
    id: String(user._id),
    firstName: user.FirstName,
    middleName: user.MiddleName || "",
    lastName: user.LastName,
    smkNo: user.SmkId,
    mobileNo: user.MobileNo ? String(user.MobileNo) : "",
    firstNameGuj: user.FirstNameGuj || "",
    middleNameGuj: user.MiddleNameGuj || "",
    lastNameGuj: user.LastNameGuj || "",
    gender: user.Gender ? String(user.Gender) : "1",
    age: user.age || 0,
    presentVillageEng: user.PresentVillageEng || "",
    addressDescription: user.AddressDescription || "",
    kutumbId: user.KutumbId,
    isMainPersonInFamily: user.IsMainPersonInFamily === true,
  };
}

export async function POST(request: Request) {
  try {
    await connectDb();

    const body = await request.json();
    const {
      mode,
      candidateId,
      mainPersonId,
      firstName,
      middleName,
      lastName,
      mobileNo,
      gender,
      age,
      presentVillageEng,
      addressDescription,
    } = body;

    if (!firstName || !lastName) {
      return NextResponse.json(
        { message: "First name and last name are required" },
        { status: 400 }
      );
    }

    if (mode === "main") {
      if (!candidateId || !mongoose.Types.ObjectId.isValid(candidateId)) {
        return NextResponse.json(
          { message: "Select a valid Non-SMK candidate" },
          { status: 400 }
        );
      }

      const presentRavisabhas = await Attendance.distinct("ravisabhaId", {
        smkDetailId: new mongoose.Types.ObjectId(candidateId),
        status: "present",
        ravisabhaId: { $exists: true, $ne: null },
      });
      if (presentRavisabhas.length < 3) {
        return NextResponse.json(
          {
            message: `Main person requires attendance at least 3 distinct ravisabhas. Current count: ${presentRavisabhas.length}`,
            attendanceCount: presentRavisabhas.length,
          },
          { status: 409 }
        );
      }

      const session = await mongoose.startSession();
      let promotedUser: any = null;
      try {
        await session.withTransaction(async () => {
          const candidate = await NonSmkCandidate.findById(candidateId).session(
            session
          );
          if (!candidate) {
            throw new Error("CANDIDATE_NOT_FOUND");
          }
          if (await SmkDetail.exists({ _id: candidate._id }).session(session)) {
            throw new Error("CANDIDATE_ALREADY_PROMOTED");
          }
          await assertMainPersonKutumbAvailable(
            candidate,
            mobileNo,
            session
          );

          const kutumbId = await getNextNonSmkKutumbId(session);
          const candidateObject = candidate.toObject();
          delete (candidateObject as any).__v;

          const created = await SmkDetail.create(
            [
              {
                ...candidateObject,
                _id: candidate._id,
                FirstName: firstName,
                MiddleName: middleName || "",
                LastName: lastName,
                Gender: gender ? parseInt(gender) : candidate.Gender || 1,
                age: age ? parseInt(age) : candidate.age || 0,
                MobileNo: mobileNo
                  ? parseInt(mobileNo)
                  : candidate.MobileNo || 0,
                PresentVillageEng:
                  presentVillageEng || candidate.PresentVillageEng || "",
                AddressDescription:
                  addressDescription || candidate.AddressDescription || "",
                KutumbId: kutumbId,
                IsMainPersonInFamily: true,
              },
            ],
            { session }
          );
          promotedUser = created[0];
          await NonSmkCandidate.deleteOne(
            { _id: candidate._id },
            { session }
          );
        });
      } finally {
        await session.endSession();
      }

      return NextResponse.json(
        {
          message: "Main person and Kutumb created successfully",
          user: formatUser(promotedUser),
        },
        { status: 201 }
      );
    }

    if (mode === "member") {
      if (!mainPersonId || !mongoose.Types.ObjectId.isValid(mainPersonId)) {
        return NextResponse.json(
          { message: "Select a valid household main person" },
          { status: 400 }
        );
      }

      const mainPerson = await SmkDetail.findOne({
        _id: mainPersonId,
        IsMainPersonInFamily: true,
        KutumbId: { $gte: 100001 },
      });
      if (!mainPerson) {
        return NextResponse.json(
          { message: "Household main person not found" },
          { status: 404 }
        );
      }

      const mainPersonObjectId = new mongoose.Types.ObjectId(mainPersonId);
      const household = await readSmkHouseholdFields(mainPersonObjectId);

      const finalSmkNo = await generateUniqueSmkId(
        firstName,
        middleName || "",
        lastName
      );
      const memberAddress = household.addressDescription;
      const memberVillage = household.presentVillageEng || "";

      const newUser = await SmkDetail.create({
        BhaktId: Date.now(),
        SmkId: finalSmkNo,
        FirstName: firstName,
        MiddleName: middleName || "",
        LastName: lastName,
        FirstNameGuj: "",
        MiddleNameGuj: "",
        LastNameGuj: "",
        Gender: gender ? parseInt(gender) : 1,
        age: age ? parseInt(age) : 0,
        MobileNo: mobileNo
          ? parseInt(mobileNo, 10)
          : household.mobileNo ?? mainPerson.MobileNo ?? 0,
        PresentVillageEng: memberVillage,
        AddressDescription: memberAddress,
        PresentVillageGuj: "",
        NativeEng: "",
        NativeGuj: "",
        ZoneName: "",
        ZoneNameGuj: "",
        SubZoneName: "",
        SubZoneNameGuj: "",
        KutumbId: mainPerson.KutumbId,
        IsMainPersonInFamily: false,
      });

      if (memberAddress || memberVillage) {
        await SmkDetail.collection.updateOne(
          { _id: newUser._id },
          {
            $set: {
              ...(memberAddress ? { AddressDescription: memberAddress } : {}),
              ...(memberVillage ? { PresentVillageEng: memberVillage } : {}),
            },
          }
        );
        if (memberAddress) {
          newUser.set("AddressDescription", memberAddress);
        }
        if (memberVillage) {
          newUser.set("PresentVillageEng", memberVillage);
        }
      }

      return NextResponse.json(
        {
          message: "Family member added successfully",
          user: formatUser(newUser),
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { message: "Choose main person or family member mode" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error adding user:", error);
    if (error.message === "CANDIDATE_NOT_FOUND") {
      return NextResponse.json(
        { message: "Non-SMK candidate not found" },
        { status: 404 }
      );
    }
    if (error.message === "CANDIDATE_ALREADY_PROMOTED") {
      return NextResponse.json(
        { message: "This candidate has already been promoted" },
        { status: 409 }
      );
    }
    if (error.message === "KUTUMB_ALREADY_EXISTS_FOR_SMK") {
      return NextResponse.json(
        {
          message:
            "A Kutumb main person already exists for this Non-SMK ID. Add family members to that Kutumb instead.",
        },
        { status: 409 }
      );
    }
    if (error.message?.startsWith("KUTUMB_ALREADY_EXISTS_FOR_MOBILE:")) {
      const kutumbId = error.message.split(":")[1];
      return NextResponse.json(
        {
          message: `A Kutumb main person with this mobile already exists (Kutumb ${kutumbId}). Add family members to that household instead.`,
        },
        { status: 409 }
      );
    }
    if (error.code === 11000) {
      return NextResponse.json(
        { message: "A conflicting user or Kutumb record already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
