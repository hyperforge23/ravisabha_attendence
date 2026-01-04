import { AttendanceRecord } from './types';
import { formatTo12Hour } from './utils';

const escapeCSV = (value: string): string => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

export const downloadCSV = (records: AttendanceRecord[], filename?: string) => {
  const headers = ['First Name', 'Middle Name', 'Last Name', 'SMK No', 'Mobile No', 'Status', 'Gender', 'Date', 'Time'];
  const rows = records.map((record) => [
    escapeCSV(record.user.firstName || ''),
    escapeCSV(record.user.middleName || ''),
    escapeCSV(record.user.lastName || ''),
    escapeCSV(record.user.smkNo || ''),
    escapeCSV(record.user.mobileNo || ''),
    escapeCSV(record.status || ''),
    escapeCSV(record.user.gender === '1' ? 'Male' : record.user.gender === '2' ? 'Female' : ''),
    escapeCSV(record.date || ''),
    escapeCSV(formatTo12Hour(record.time)),
  ]);

  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [headers.map(escapeCSV).join(','), ...rows.map((row) => row.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename || 'attendance_export.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
