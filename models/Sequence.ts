import mongoose, { ClientSession, Document, Model, Schema } from "mongoose";

interface ISequence extends Document {
  key: string;
  value: number;
}

const SequenceSchema = new Schema<ISequence>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Number, required: true },
  },
  {
    collection: "sequences",
    timestamps: true,
  }
);

const Sequence: Model<ISequence> =
  (mongoose.models.sequences as Model<ISequence>) ||
  mongoose.model<ISequence>("sequences", SequenceSchema);

export async function getNextNonSmkKutumbId(session?: ClientSession) {
  const sequence = await Sequence.findOneAndUpdate(
    { key: "non_smk_kutumb_id" },
    [
      {
        $set: {
          key: "non_smk_kutumb_id",
          value: {
            $add: [
              { $max: [{ $ifNull: ["$value", 100000] }, 100000] },
              1,
            ],
          },
        },
      },
    ],
    {
      upsert: true,
      new: true,
      session,
      updatePipeline: true,
    }
  );

  return sequence.value;
}

export default Sequence;
