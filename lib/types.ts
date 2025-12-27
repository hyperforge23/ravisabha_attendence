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
  bhaktId?: number;
  age?: number;
  presentVillageEng?: string;
  presentVillageGuj?: string;
  nativeEng?: string;
  nativeGuj?: string;
  zoneName?: string;
  zoneNameGuj?: string;
  subZoneName?: string;
  subZoneNameGuj?: string;
  kutumbId?: number;
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
