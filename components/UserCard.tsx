'use client';

import { useState, useEffect } from 'react';
import { User, AttendanceStatus } from '@/lib/types';
import { useAttendance } from '@/components/AttendanceProvider';
import { Calendar, Clock, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserCardProps {
  user: User;
  onClear: () => void;
}

export default function UserCard({ user, onClear }: UserCardProps) {
  const { addRecord } = useAttendance();
  const [status, setStatus] = useState<AttendanceStatus | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    const now = new Date();
    setDate(now.toISOString().split('T')[0]);
    setTime(now.toTimeString().slice(0, 5));
  }, []);

  const handleSubmit = () => {
    if (!status || !date || !time) return;

    addRecord({
      id: crypto.randomUUID(),
      user,
      status,
      date,
      time,
      timestamp: new Date(`${date}T${time}`).getTime(),
    });

    onClear();
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {user.firstName} {user.lastName}
          </h3>
          <div className="mt-1 flex flex-col gap-1 text-sm text-gray-500 sm:flex-row sm:gap-4">
            <span>SMK No : {user.smkNo}</span>
            <span className="hidden sm:inline">•</span>
            <span>Mobile No : {user.mobileNo}</span>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setStatus('Present')}
              className={cn(
                "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all",
                status === 'Present'
                  ? "bg-white text-green-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              <Check className="h-4 w-4" />
              Present
            </button>
            <button
              onClick={() => setStatus('Absent')}
              className={cn(
                "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all",
                status === 'Absent'
                  ? "bg-white text-red-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              <X className="h-4 w-4" />
              Absent
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="relative">
          <label className="mb-1.5 block text-xs font-medium text-gray-500">Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 py-2 text-sm text-gray-900 focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
        </div>
        <div className="relative">
          <label className="mb-1.5 block text-xs font-medium text-gray-500">Time</label>
          <div className="relative">
            <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 py-2 text-sm text-gray-900 focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
        </div>
        <div className="flex items-end">
          <button
            onClick={handleSubmit}
            disabled={!status}
            className="w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add to List
          </button>
        </div>
      </div>
    </div>
  );
}
