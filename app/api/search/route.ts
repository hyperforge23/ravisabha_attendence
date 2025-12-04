import { NextResponse } from 'next/server';
import { connectDb } from '@/lib/db';
import SmkDetail from '@/models/SmkDetail';
import { PipelineStage } from 'mongoose';

export async function GET(request: Request) {
  try {
    await connectDb();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const field = searchParams.get('field');

    if (!query || !field) {
      return NextResponse.json({ users: [] });
    }

    let dbQuery = {};
    let aggregationPipeline: PipelineStage[] = [];

    // Map frontend field names to DB field names
    switch (field) {
      case 'firstName':
        dbQuery = { FirstName: { $regex: query, $options: 'i' } };
        break;
      case 'lastName':
        dbQuery = { LastName: { $regex: query, $options: 'i' } };
        break;
      case 'smkNo':
        dbQuery = { SmkId: { $regex: query, $options: 'i' } };
        break;
      case 'mobileNo':
        // For numeric MobileNo, we need aggregation to convert to string for regex search
        aggregationPipeline = [
          {
            $addFields: {
              mobileStr: { $toString: "$MobileNo" }
            }
          },
          {
            $match: {
              mobileStr: { $regex: query, $options: 'i' }
            }
          },
          {
            $limit: 10 // Limit results for performance
          }
        ];
        break;
      default:
        return NextResponse.json({ users: [] });
    }

    let users;
    if (field === 'mobileNo') {
      users = await SmkDetail.aggregate(aggregationPipeline);
    } else {
      users = await SmkDetail.find(dbQuery).limit(10);
    }

    // Map DB result to frontend User interface
    const formattedUsers = users.map((user: any) => ({
      id: user._id.toString(),
      firstName: user.FirstName,
      lastName: user.LastName,
      smkNo: user.SmkId,
      mobileNo: user.MobileNo ? user.MobileNo.toString() : '',
      firstNameGuj: user.FirstNameGuj,
      lastNameGuj: user.LastNameGuj,
      gender: user.Gender?.toString(),
    }));

    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
