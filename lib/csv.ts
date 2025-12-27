import { AttendanceRecord } from './types';
import { formatTo12Hour } from './utils';

export const downloadCSV = (records: AttendanceRecord[]) => {
  const headers = ['First Name', 'Middle Name', 'Last Name', 'SMK No', 'Mobile No', 'Status', 'Date', 'Gender', 'Time'];
  const rows = records.map((record) => [
    record.user.firstName,
    record.user.middleName,
    record.user.lastName,
    record.user.smkNo,
    record.user.mobileNo,
    record.status,
    record.date,
    record.user.gender === '1' ? 'Male' : 'Female',
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
