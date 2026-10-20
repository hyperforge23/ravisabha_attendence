import { AttendanceRecord } from './types';
import { formatTo12Hour } from './utils';

const escapeCSV = (value: string | number | undefined | null): string => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};


export type CsvRecord = AttendanceRecord & {
  preAttendanceStatus?: string;
  attendanceStatus?: string;
};

export const downloadCSV = (records: CsvRecord[], filename?: string) => {
  const includeComparison = records.some(
    (record) => record.preAttendanceStatus || record.attendanceStatus
  );
  const headers = [
    'Kutumb ID', 'SMK No',
    'First Name', 'Middle Name', 'Last Name',
    'First Name (Guj)', 'Middle Name (Guj)', 'Last Name (Guj)',
    'Mobile No',
    'Gender', 'Age', 'Bhakt ID',
    'Present Village', 'Present Village (Guj)',
    'Native', 'Native (Guj)', 'Zone', 'Zone (Guj)',
    'Sub Zone', 'Sub Zone (Guj)',
    'Status', 'Date', 'Time',
    ...(includeComparison ? ['Pre-Attendance', 'Attendance'] : []),
    'Family Leader', 'Family Leader (Guj)',
  ];
  const rows = records.map((record) => [
    record.user.kutumbId || '',
    record.user.smkNo,
    record.user.firstName,
    record.user.middleName || '',
    record.user.lastName,
    record.user.firstNameGuj || '',
    record.user.middleNameGuj || '',
    record.user.lastNameGuj || '',
    record.user.mobileNo,
    record.user.gender === '1' ? 'Male' : record.user.gender === '2' ? 'Female' : record.user.gender || '',
    record.user.age || '',
    record.user.bhaktId || '',
    record.user.presentVillageEng || '',
    record.user.presentVillageGuj || '',
    record.user.nativeEng || '',
    record.user.nativeGuj || '',
    record.user.zoneName || '',
    record.user.zoneNameGuj || '',
    record.user.subZoneName || '',
    record.user.subZoneNameGuj || '',
    record.status,
    record.date,
    formatTo12Hour(record.time),
    ...(includeComparison ? [record.preAttendanceStatus || '', record.attendanceStatus || ''] : []),
    record.user.familyLeaderNameEng || '',
    record.user.familyLeaderNameGuj || '',
  ]);

  // Create CSV content with proper UTF-8 BOM for Excel compatibility
  const csvContent = [
    headers.map(escapeCSV).join(','), 
    ...rows.map((row) => row.map((value) => escapeCSV(value)).join(','))
  ].join('\n');

  // Add UTF-8 BOM (Byte Order Mark) so Excel recognizes Unicode characters
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename || 'attendance_export.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
};
