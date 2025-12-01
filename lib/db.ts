import mongoose from "mongoose";
import mongooseAutoPopulate from "mongoose-autopopulate";

export const connectDb = () => {
  const dbUrl = process.env.MONGODB_URI;

  if (!dbUrl) {
    throw new Error("Environment Variables are not set for DB.");
  }

  // Register plugin globally
  mongoose.plugin(mongooseAutoPopulate);

  return mongoose
    .connect(dbUrl) // No need for user/pass options
    .then(() => {
      console.log("✅ Connected to MongoDB");
    })
    .catch((error) => {
      console.error("❌ Error connecting to MongoDB:", error);
    });
};