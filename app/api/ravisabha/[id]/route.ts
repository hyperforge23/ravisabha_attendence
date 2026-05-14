import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import RavisabhaDetails from "@/models/RavisabhaDetails";
// Import all models to ensure they are registered
import "@/models";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();

    const { id } = await params;
    const ravisabha = await RavisabhaDetails.findById(id);

    if (!ravisabha) {
      return NextResponse.json(
        { message: "Ravisabha not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ravisabha }, { status: 200 });
  } catch (error) {
    console.error("Error fetching ravisabha:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();

    const { id } = await params;
    const body = await request.json();
    const { date, prasad, expense, yajman, notes, mehmanMale, mehmanFemale } = body;

    const updateData: any = {};
    if (date) updateData.date = new Date(date);
    if (prasad !== undefined) updateData.prasad = prasad || null;
    if (expense !== undefined) updateData.expense = expense ? parseFloat(expense) : null;
    if (yajman !== undefined) updateData.yajman = yajman || null;
    if (notes !== undefined) updateData.notes = notes || null;
    if (mehmanMale !== undefined) updateData.mehmanMale = Math.max(0, parseInt(mehmanMale) || 0);
    if (mehmanFemale !== undefined) updateData.mehmanFemale = Math.max(0, parseInt(mehmanFemale) || 0);

    const updatedRavisabha = await RavisabhaDetails.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedRavisabha) {
      return NextResponse.json(
        { message: "Ravisabha not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Ravisabha updated successfully", ravisabha: updatedRavisabha },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating ravisabha:", error);
    
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();

    const { id } = await params;
    const body = await request.json();
    const { mehmanMaleInc, mehmanFemaleInc } = body;

    const incData: any = {};
    if (mehmanMaleInc !== undefined) incData.mehmanMale = Math.max(0, parseInt(mehmanMaleInc) || 0);
    if (mehmanFemaleInc !== undefined) incData.mehmanFemale = Math.max(0, parseInt(mehmanFemaleInc) || 0);

    const updatedRavisabha = await RavisabhaDetails.findByIdAndUpdate(
      id,
      { $inc: incData },
      { new: true }
    );

    if (!updatedRavisabha) {
      return NextResponse.json({ message: "Ravisabha not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Mehman count incremented", ravisabha: updatedRavisabha },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error incrementing mehman count:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();

    const { id } = await params;
    const deletedRavisabha = await RavisabhaDetails.findByIdAndDelete(id);

    if (!deletedRavisabha) {
      return NextResponse.json(
        { message: "Ravisabha not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Ravisabha deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting ravisabha:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

