'use client';

import { useState, useMemo } from 'react';
import { useAttendance } from '@/components/AttendanceProvider';
import { filterRecordsByRange } from '@/lib/dateUtils';
import { downloadCSV } from '@/lib/csv';
import { cn, formatTo12Hour } from '@/lib/utils';
import { Download, Calendar as CalendarIcon } from 'lucide-react';

type DateRange = 'this-month' | 'last-3-months' | 'last-6-months' | 'custom';

export default function ExportPage() {
  const { records } = useAttendance();
  const [range, setRange] = useState<DateRange>('this-month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredRecords = useMemo(() => {
    return filterRecordsByRange(records, range, startDate, endDate);
  }, [records, range, startDate, endDate]);

  const handleExport = () => {
    downloadCSV(filteredRecords);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Export Data</h1>
        <p className="text-gray-500">Export attendance records based on selected time range.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'this-month', label: 'This Month' },
              { id: 'last-3-months', label: 'Last 3 Months' },
              { id: 'last-6-months', label: 'Last 6 Months' },
              { id: 'custom', label: 'Custom Range' },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setRange(option.id as DateRange)}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium transition-all",
                  range === option.id
                    ? "bg-black text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          {range === 'custom' && (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="relative">
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Start Date</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 py-2 text-sm text-gray-900 focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>
              <div className="relative">
                <label className="mb-1.5 block text-xs font-medium text-gray-500">End Date</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 py-2 text-sm text-gray-900 focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Preview <span className="text-sm font-normal text-gray-500">({filteredRecords.length} records)</span>
        </h2>
        <button
          onClick={handleExport}
          disabled={filteredRecords.length === 0}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="hidden px-6 py-3 font-medium md:table-cell">SMK No</th>
                <th className="hidden px-6 py-3 font-medium md:table-cell">Mobile</th>
                <th className="px-6 py-3 font-medium">Date & Time</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {record.user.firstName} {record.user.lastName}
                    </td>
                    <td className="hidden px-6 py-4 text-gray-500 md:table-cell">{record.user.smkNo}</td>
                    <td className="hidden px-6 py-4 text-gray-500 md:table-cell">{record.user.mobileNo}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {record.date} <span className="text-gray-300">|</span> {formatTo12Hour(record.time)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          record.status === 'Present'
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        )}
                      >
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No records found for the selected range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
