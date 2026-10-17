import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRavisabhaDetails extends Document {
  date: Date;
  prasad?: string;
  expense?: number;
  yajman?: string;
  notes?: string;
  mehmanMale?: number;
  mehmanFemale?: number;
  bhojanCount?: number;
  pre_attendance?: boolean;
}

const RavisabhaDetailsSchema: Schema<IRavisabhaDetails> = new Schema(
  {
    date: {
      type: Date,
      required: true,
      unique: true, // Only one ravisabha per date
    },
    prasad: {
      type: String,
    },
    expense: {
      type: Number,
    },
    yajman: {
      type: String,
    },
    notes: {
      type: String,
    },
    mehmanMale: {
      type: Number,
      default: 0,
    },
    mehmanFemale: {
      type: Number,
      default: 0,
    },
    bhojanCount: {
      type: Number,
      default: 0,
    },
    pre_attendance: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "ravisabha_details",
  }
);

const RavisabhaDetails: Model<IRavisabhaDetails> =
  (mongoose.models.ravisabha_details as Model<IRavisabhaDetails>) ||
  mongoose.model<IRavisabhaDetails>("ravisabha_details", RavisabhaDetailsSchema);

export async function getPreAttendanceConflictMessage(excludeId?: string) {
  const filter: { pre_attendance: boolean; _id?: { $ne: string } } = { pre_attendance: true };
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }

  const active = await RavisabhaDetails.find(filter).select("date").lean();
  if (active.length === 0) return null;

  const dates = active.map((item) =>
    new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    })
  );

  if (dates.length === 1) {
    return `Another ravisabha dated ${dates[0]} already has pre-attendance active`;
  }

  return `Other ravisabhas dated ${dates.join(", ")} already have pre-attendance active`;
}

export default RavisabhaDetails;

