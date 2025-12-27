import { AttendanceRecord } from './types';
import { formatTo12Hour } from './utils';

export const downloadCSV = (records: AttendanceRecord[]) => {
  const headers = [
    'First Name', 'Middle Name', 'Last Name', 
    'First Name (Guj)', 'Middle Name (Guj)', 'Last Name (Guj)',
    'SMK No', 'Mobile No', 'Gender', 'Age',
    'Bhakt ID', 'Present Village', 'Present Village (Guj)',
    'Native', 'Native (Guj)', 'Zone', 'Zone (Guj)',
    'Sub Zone', 'Sub Zone (Guj)', 'Kutumb ID',
    'Status', 'Date', 'Time'
  ];
  const rows = records.map((record) => [
    record.user.firstName,
    record.user.middleName || '',
    record.user.lastName,
    record.user.firstNameGuj || '',
    record.user.middleNameGuj || '',
    record.user.lastNameGuj || '',
    record.user.smkNo,
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
    record.user.kutumbId || '',
    record.status,
    record.date,
    formatTo12Hour(record.time),
  ]);

  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'attendance_export.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
