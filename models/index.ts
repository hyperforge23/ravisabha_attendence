// Import all models to ensure they are registered with Mongoose
// This ensures that populate() and other operations can find referenced models
import SmkDetail from "./SmkDetail";
import Attendance from "./Attendance";
import User from "./User";

// Re-export for convenience
export { default as SmkDetail } from "./SmkDetail";
export { default as Attendance } from "./Attendance";
export { default as User } from "./User";

// This file ensures all models are registered when imported
// Import this file in API routes that use populate() or cross-model queries

