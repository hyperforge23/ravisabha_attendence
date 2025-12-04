'use client';

import { useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { useAttendance } from '@/components/AttendanceProvider';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { Calendar, Clock } from 'lucide-react';

interface UserCardProps {
  user: User;
  onClear: () => void;
}

export default function UserCard({ user, onClear }: UserCardProps) {
  const { addRecord, records } = useAttendance();
  const { user: authUser } = useAuth();

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const now = new Date();
    setDate(now.toISOString().split('T')[0]);
    setTime(now.toTimeString().slice(0, 5));
  }, []);

  const handleSubmit = async () => {
    if (!date || !time || !authUser) return;

    const isDuplicate = records.some(
      (record) => record.user.id === user.id && record.date === date
    );

    if (isDuplicate) {
      toast.error('Already added');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          smkDetailId: user.id,
          userId: authUser.id,
          SmkId: user.smkNo,
          name: `${user.firstName} ${user.lastName}`,
          status: 'present',
          date: new Date(`${date}T${time}`),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save attendance');
      }

      const data = await response.json();

      addRecord({
        id: data.attendance._id,
        user,
        status: 'Present',
        date,
        time,
        timestamp: new Date(`${date}T${time}`).getTime(),
      });

      toast.success('Attendance marked');
      onClear();
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Failed to mark attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {user.firstName} {user.lastName}
            {user.firstNameGuj && user.lastNameGuj && (
              <span className="ml-2 font-normal text-gray-500">
                ({user.firstNameGuj} {user.lastNameGuj})
              </span>
            )}
          </h3>
          <div className="mt-1 flex flex-col gap-1 text-sm text-gray-500 sm:flex-row sm:gap-4">
            <span>SMK No : {user.smkNo}</span>
            <span className="hidden sm:inline">•</span>
            <span>Mobile No : {user.mobileNo}</span>
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
              disabled
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 py-2 text-sm text-gray-900 focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black disabled:opacity-60 disabled:cursor-not-allowed"
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
            disabled={isSubmitting}
            className="w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Present'}
          </button>
        </div>
      </div>
    </div>
  );
}
