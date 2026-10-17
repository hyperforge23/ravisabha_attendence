import mongoose, { Document, Model, Schema } from "mongoose";

export interface INonSmkCandidate extends Document {
  BhaktId: number;
  SmkId: string;
  FirstName: string;
  MiddleName?: string;
  LastName: string;
  FirstNameGuj?: string;
  MiddleNameGuj?: string;
  LastNameGuj?: string;
  Gender?: number;
  age?: number;
  MobileNo?: number;
  PresentVillageEng?: string;
  PresentVillageGuj?: string;
  NativeEng?: string;
  NativeGuj?: string;
  ZoneName?: string;
  ZoneNameGuj?: string;
  SubZoneName?: string;
  SubZoneNameGuj?: string;
  KutumbId?: number;
  AddressDescription?: string;
  FamilyLeaderNameEng?: string;
  FamilyLeaderNameGuj?: string;
}

const NonSmkCandidateSchema = new Schema<INonSmkCandidate>(
  {
    BhaktId: { type: Number, required: true },
    SmkId: { type: String, required: true },
    FirstName: { type: String, required: true },
    MiddleName: { type: String },
    LastName: { type: String, required: true },
    FirstNameGuj: { type: String },
    MiddleNameGuj: { type: String },
    LastNameGuj: { type: String },
    Gender: { type: Number },
    age: { type: Number },
    MobileNo: { type: Number },
    PresentVillageEng: { type: String },
    PresentVillageGuj: { type: String },
    NativeEng: { type: String },
    NativeGuj: { type: String },
    ZoneName: { type: String },
    ZoneNameGuj: { type: String },
    SubZoneName: { type: String },
    SubZoneNameGuj: { type: String },
    KutumbId: { type: Number },
    AddressDescription: { type: String },
    FamilyLeaderNameEng: { type: String },
    FamilyLeaderNameGuj: { type: String },
  },
  {
    timestamps: true,
    collection: "non_smk_candidates",
  }
);

const NonSmkCandidate: Model<INonSmkCandidate> =
  (mongoose.models.non_smk_candidates as Model<INonSmkCandidate>) ||
  mongoose.model<INonSmkCandidate>(
    "non_smk_candidates",
    NonSmkCandidateSchema
  );

export default NonSmkCandidate;
