import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  UserName: string;
  Password: string;
  role: "admin" | "enterer";
}

const UserSchema: Schema<IUser> = new Schema(
  {
    UserName: { type: String, required: true, unique: true },
    Password: { type: String, required: true },
    role: { type: String, enum: ["admin", "enterer"], default: "enterer" }
  },
  { timestamps: true }
);

const User: Model<IUser> =
  mongoose.models.users || mongoose.model<IUser>("users", UserSchema);

export default User;
