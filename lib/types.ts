export interface User {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  smkNo: string;
  mobileNo: string;
  firstNameGuj?: string;
  middleNameGuj?: string;
  lastNameGuj?: string;
  gender?: string;
}

export type AttendanceStatus = "Present" | "Absent";

export interface AttendanceRecord {
  id: string;
  user: User;
  status: AttendanceStatus;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  timestamp: number; // For sorting
}
