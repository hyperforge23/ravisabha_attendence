import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAttendance extends Document {
  smkDetailId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  ravisabhaId?: mongoose.Types.ObjectId;
  status: "present" | "absent";
  date: Date;
  SmkId: string;
  name: string;
}

const AttendanceSchema: Schema<IAttendance> = new Schema(
  {
    smkDetailId: {
      type: Schema.Types.ObjectId,
      ref: "smkdetails",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    ravisabhaId: {
      type: Schema.Types.ObjectId,
      ref: "ravisabha_details",
    },
    name: {
      type: String,
    },
    status: {
      type: String,
      enum: ["present", "absent"],
      default: "absent",
    },
    SmkId: { type: String, required: true },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Attendance: Model<IAttendance> =
  mongoose.models.ravisabha_attendance ||
  mongoose.model<IAttendance>("ravisabha_attendance", AttendanceSchema);

export default Attendance;
