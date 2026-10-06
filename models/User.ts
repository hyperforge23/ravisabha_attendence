import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  UserName: string;
  Password: string;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    UserName: { type: String, required: true, unique: true },
    Password: { type: String, required: true }
  },
  { timestamps: true }
);

const User: Model<IUser> =
  mongoose.models.users || mongoose.model<IUser>("users", UserSchema);

export default User;
