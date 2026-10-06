import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import SmkDetail from "@/models/SmkDetail";

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

export async function POST(request: Request) {
  try {
    await connectDb();

    const body = await request.json();
    const {
      firstName,
      middleName,
      lastName,
      smkNo,
      mobileNo,
      gender,
      age,
      presentVillageEng,
    } = body;

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json(
        { message: "First name and last name are required" },
        { status: 400 }
      );
    }

    // Generate SMK ID if not provided
    let finalSmkNo = smkNo?.trim();
    if (!finalSmkNo) {
      finalSmkNo = generateSmkId(firstName, middleName || '', lastName);
    }

    // Check if SMK number already exists
    const existingUser = await SmkDetail.findOne({ SmkId: finalSmkNo });
    if (existingUser) {
      return NextResponse.json(
        { message: "User with this SMK number already exists" },
        { status: 409 }
      );
    }

    // Generate BhaktId (using timestamp for uniqueness)
    const generatedBhaktId = Date.now();

    const newUser = await SmkDetail.create({
      BhaktId: generatedBhaktId,
      SmkId: finalSmkNo,
      FirstName: firstName,
      MiddleName: middleName || "",
      LastName: lastName,
      FirstNameGuj: "",
      MiddleNameGuj: "",
      LastNameGuj: "",
      Gender: gender ? parseInt(gender) : 1,
      age: age ? parseInt(age) : 0,
      MobileNo: mobileNo ? parseInt(mobileNo) : 0,
      PresentVillageEng: presentVillageEng || "",
      PresentVillageGuj: "",
      NativeEng: "",
      NativeGuj: "",
      ZoneName: "",
      ZoneNameGuj: "",
      SubZoneName: "",
      SubZoneNameGuj: "",
      KutumbId: 0,
    });

    // Format response to match User interface
    const formattedUser = {
      id: newUser._id.toString(),
      firstName: newUser.FirstName,
      middleName: newUser.MiddleName,
      lastName: newUser.LastName,
      smkNo: newUser.SmkId,
      mobileNo: newUser.MobileNo ? newUser.MobileNo.toString() : "",
      firstNameGuj: newUser.FirstNameGuj,
      middleNameGuj: newUser.MiddleNameGuj,
      lastNameGuj: newUser.LastNameGuj,
      gender: newUser.Gender?.toString(),
    };

    return NextResponse.json(
      { message: "User added successfully", user: formattedUser },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error adding user:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
