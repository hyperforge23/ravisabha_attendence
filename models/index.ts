// Import all models to ensure they are registered with Mongoose
// This ensures that populate() and other operations can find referenced models
import SmkDetail from "./SmkDetail";
import Attendance from "./Attendance";
import User from "./User";
import RavisabhaDetails from "./RavisabhaDetails";
import PreAttendance from "./PreAttendence";
import NonSmkCandidate from "./NonSmkCandidate";
import Sequence from "./Sequence";

// Re-export for convenience
export { default as SmkDetail } from "./SmkDetail";
export { default as Attendance } from "./Attendance";
export { default as User } from "./User";
export { default as RavisabhaDetails } from "./RavisabhaDetails";
export { default as PreAttendance } from "./PreAttendence";
export { default as NonSmkCandidate } from "./NonSmkCandidate";
export { default as Sequence } from "./Sequence";

// This file ensures all models are registered when imported
// Import this file in API routes that use populate() or cross-model queries

