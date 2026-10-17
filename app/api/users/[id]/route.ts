import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import SmkDetail from "@/models/SmkDetail";
import Attendance from "@/models/Attendance";

// GET single user
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();
    const { id } = await params;

    const user = await SmkDetail.findById(id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const formattedUser = {
      id: user._id.toString(),
      firstName: user.FirstName,
      lastName: user.LastName,
      middleName: user.MiddleName,
      smkNo: user.SmkId,
      mobileNo: user.MobileNo ? user.MobileNo.toString() : "",
      gender: user.Gender?.toString(),
      age: user.age,
      presentVillageEng: user.PresentVillageEng,
      addressDescription: user.AddressDescription || "",
      kutumbId: user.KutumbId,
      isMainPersonInFamily: user.IsMainPersonInFamily === true,
    };

    return NextResponse.json({ user: formattedUser }, { status: 200 });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update user
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();
    const { id } = await params;
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
      addressDescription,
    } = body;

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json(
        { message: "First name and last name are required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await SmkDetail.findById(id);
    if (!existingUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // If SMK number is being changed, check for duplicates
    if (smkNo && smkNo !== existingUser.SmkId) {
      const duplicateSmk = await SmkDetail.findOne({ SmkId: smkNo });
      if (duplicateSmk) {
        return NextResponse.json(
          { message: "User with this SMK number already exists" },
          { status: 409 }
        );
      }
    }

    const updateFields = {
      FirstName: firstName,
      MiddleName: middleName || "",
      LastName: lastName,
      SmkId: smkNo || existingUser.SmkId,
      Gender: gender ? parseInt(gender) : existingUser.Gender,
      age: age !== undefined && age !== "" ? parseInt(age, 10) : existingUser.age,
      MobileNo: mobileNo ? parseInt(mobileNo, 10) : existingUser.MobileNo,
      PresentVillageEng: presentVillageEng ?? existingUser.PresentVillageEng ?? "",
      AddressDescription:
        addressDescription !== undefined
          ? addressDescription
          : existingUser.AddressDescription ?? "",
    };

    const updateResult = await SmkDetail.updateOne(
      { _id: id },
      { $set: updateFields }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { message: "Failed to update user" },
        { status: 500 }
      );
    }

    const updatedUser = await SmkDetail.findById(id);

    if (!updatedUser) {
      return NextResponse.json(
        { message: "Failed to update user" },
        { status: 500 }
      );
    }

    const formattedUser = {
      id: updatedUser._id.toString(),
      firstName: updatedUser.FirstName,
      middleName: updatedUser.MiddleName,
      lastName: updatedUser.LastName,
      smkNo: updatedUser.SmkId,
      mobileNo: updatedUser.MobileNo ? updatedUser.MobileNo.toString() : "",
      firstNameGuj: updatedUser.FirstNameGuj,
      middleNameGuj: updatedUser.MiddleNameGuj,
      lastNameGuj: updatedUser.LastNameGuj,
      gender: updatedUser.Gender?.toString(),
      presentVillageEng: updatedUser.PresentVillageEng || "",
      addressDescription: updatedUser.AddressDescription || "",
      kutumbId: updatedUser.KutumbId,
      isMainPersonInFamily: updatedUser.IsMainPersonInFamily === true,
    };

    return NextResponse.json(
      { message: "User updated successfully", user: formattedUser },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE user
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();
    const { id } = await params;

    // Check if user exists
    const user = await SmkDetail.findById(id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check if user has attendance records
    const attendanceCount = await Attendance.countDocuments({
      smkDetailId: id,
    });

    if (attendanceCount > 0) {
      return NextResponse.json(
        {
          message: `Cannot delete user. This user has ${attendanceCount} attendance record(s). Please delete attendance records first.`,
          attendanceCount,
        },
        { status: 409 }
      );
    }

    if (user.IsMainPersonInFamily && user.KutumbId) {
      const familyMemberCount = await SmkDetail.countDocuments({
        KutumbId: user.KutumbId,
        _id: { $ne: user._id },
      });
      if (familyMemberCount > 0) {
        return NextResponse.json(
          {
            message: `Cannot delete the main person while ${familyMemberCount} family member(s) are linked to Kutumb ${user.KutumbId}.`,
            familyMemberCount,
          },
          { status: 409 }
        );
      }
    }

    // Delete user
    await SmkDetail.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
