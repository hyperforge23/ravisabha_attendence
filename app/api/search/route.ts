import { NextResponse } from 'next/server';
import { connectDb } from '@/lib/db';
import SmkDetail from '@/models/SmkDetail';
import { PipelineStage } from 'mongoose';

export async function GET(request: Request) {
  try {
    await connectDb();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json({ users: [] });
    }

    // Search across all fields using $or operator
    // For mobileNo, we need to use aggregation to convert to string for regex search
    const aggregationPipeline: PipelineStage[] = [
      {
        $addFields: {
          mobileStr: { $toString: "$MobileNo" }
        }
      },
      {
        $match: {
          $or: [
            { FirstName: { $regex: query, $options: 'i' } },
            { MiddleName: { $regex: query, $options: 'i' } },
            { LastName: { $regex: query, $options: 'i' } },
            { SmkId: { $regex: query, $options: 'i' } },
            { mobileStr: { $regex: query, $options: 'i' } }
          ]
        }
      },
      {
        $limit: 10 // Limit results for performance
      }
    ];

    // Map frontend field names to DB field names
    switch (field) {
      case 'firstName':
        dbQuery = { FirstName: { $regex: query, $options: 'i' } };
        break;
      case 'lastName':
        dbQuery = { LastName: { $regex: query, $options: 'i' } };
        break;
      case 'anyName':
        dbQuery = {
          $or: [
            { FirstName: { $regex: query, $options: 'i' } },
            { LastName: { $regex: query, $options: 'i' } },
          ],
        };
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
      middleName: user.MiddleName,
      lastName: user.LastName,
      smkNo: user.SmkId,
      mobileNo: user.MobileNo ? user.MobileNo.toString() : '',
      firstNameGuj: user.FirstNameGuj,
      middleNameGuj: user.MiddleNameGuj,
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
