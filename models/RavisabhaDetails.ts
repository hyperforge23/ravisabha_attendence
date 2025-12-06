import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRavisabhaDetails extends Document {
  date: Date;
  prasad?: string;
  expense?: number;
  yajman?: string;
  notes?: string;
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
  },
  {
    timestamps: true,
    collection: "ravisabha_details",
  }
);

const RavisabhaDetails: Model<IRavisabhaDetails> =
  mongoose.models.ravisabha_details ||
  mongoose.model<IRavisabhaDetails>("ravisabha_details", RavisabhaDetailsSchema);

export default RavisabhaDetails;

