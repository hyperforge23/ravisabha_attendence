/**
 * Central count utility for ravisabha attendance counts.
 * Used by the API and can be consumed anywhere via /api/counts endpoint.
 */

import mongoose from 'mongoose';
import Attendance from '@/models/Attendance';
import RavisabhaDetails from '@/models/RavisabhaDetails';
import '@/models'; // ensure all models are registered

export interface RavisabhaCounts {
    male: number;
    female: number;
    bhojan: number;
    mehmanMale: number;
    mehmanFemale: number;
    total: number;
    records: {
        id: string;
        userId: string;
        name: string;
        smkNo: string;
        mobileNo: string;
        gender: string;
        status: string;
        date: string;
        time: string;
        createdByUsername: string;
    }[];
}

export async function getRavisabhaCounts(ravisabhaId: string): Promise<RavisabhaCounts> {
    const objectId = new mongoose.Types.ObjectId(ravisabhaId);

    // Fetch mehman counts from ravisabha doc
    const ravisabha = (await RavisabhaDetails.findById(objectId).lean()) as any;
    const mehmanMale = ravisabha?.mehmanMale ?? 0;
    const mehmanFemale = ravisabha?.mehmanFemale ?? 0;

    // Aggregate - lookup from both SmkDetail and NonSmkCandidate
    // Records with missing user data are still counted (no filter)
    const attendanceRecords = await Attendance.aggregate([
        { $match: { ravisabhaId: objectId } },
        {
            $lookup: {
                from: 'smkdetails',
                localField: 'smkDetailId',
                foreignField: '_id',
                as: 'smkUser',
            },
        },
        {
            $lookup: {
                from: 'non_smk_candidates',
                localField: 'smkDetailId',
                foreignField: '_id',
                as: 'nonSmkUser',
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'createdBy',
            },
        },
        { $sort: { date: -1 } },
    ]);

    let male = 0;
    let female = 0;
    let bhojan = 0;

    const records = attendanceRecords.map((r: any) => {
        // Prefer SmkDetail, fall back to NonSmkCandidate, fall back to empty
        const user = r.smkUser?.[0] || r.nonSmkUser?.[0] || null;

        const gender = user?.Gender?.toString() || '';
        if (gender === '1') male++;
        else if (gender === '2') female++;
        else {
            // If gender unknown but record exists, still count in total
            // Try to infer from stored name/SmkId on attendance record itself
        }
        if (r.bhojan) bhojan++;

        return {
            id: String(r._id),
            userId: String(r.smkDetailId),
            name: user
                ? `${user.FirstName} ${user.MiddleName || ''} ${user.LastName}`.trim()
                : r.name || r.SmkId || 'Unknown',
            smkNo: user?.SmkId || r.SmkId || '',
            mobileNo: user?.MobileNo?.toString() || '',
            gender,
            status: r.status,
            date: r.date ? new Date(r.date).toISOString().split('T')[0] : '',
            time: r.date ? new Date(r.date).toTimeString().slice(0, 5) : '',
            createdByUsername: r.createdBy?.[0]?.UserName || '',
        };
    });

    // For records where gender was unknown, use total record count minus known genders
    // to ensure total always matches actual attendance count
    const knownGenderCount = male + female;
    const unknownGenderCount = records.length - knownGenderCount;

    return {
        male,
        female,
        bhojan,
        mehmanMale,
        mehmanFemale,
        // Total = all attendance records + mehman (not double counting)
        total: records.length + mehmanMale + mehmanFemale,
        records,
    };
}
