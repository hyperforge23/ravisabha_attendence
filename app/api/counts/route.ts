import { NextRequest, NextResponse } from 'next/server';
import { connectDb } from '@/lib/db';
import { getRavisabhaCounts } from '@/lib/count';
import { requireRole } from '@/lib/auth';
import mongoose from 'mongoose';
import '@/models';

export async function GET(request: NextRequest) {
  const authResult = await requireRole(request, ['admin', 'enterer']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDb();

    const { searchParams } = new URL(request.url);
    const ravisabhaId = searchParams.get('ravisabhaId');

    if (!ravisabhaId || !mongoose.Types.ObjectId.isValid(ravisabhaId)) {
      return NextResponse.json({ message: 'Valid ravisabhaId is required' }, { status: 400 });
    }

    const counts = await getRavisabhaCounts(ravisabhaId);
    return NextResponse.json(counts, { status: 200 });
  } catch (error) {
    console.error('Error fetching counts:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
