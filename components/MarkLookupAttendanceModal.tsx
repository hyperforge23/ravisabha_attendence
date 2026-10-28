'use client';

import { useState, useEffect } from 'react';
import { X, UserCheck } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthProvider';
import { useAttendance } from '@/components/AttendanceProvider';

interface MarkAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  candidateId: string;
  candidateName: string;
  candidateSmkNo: string;
  currentAttendanceCount: number;
}

export default function MarkLookupAttendanceModal({
  isOpen,
  onClose,
  onSuccess,
  candidateId,
  candidateName,
  candidateSmkNo,
  currentAttendanceCount,
}: MarkAttendanceModalProps) {
  const { user: authUser } = useAuth();
  const { refreshRecords } = useAttendance();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [todayRavisabhaId, setTodayRavisabhaId] = useState<string | null>(null);
  const [isLoadingRavisabha, setIsLoadingRavisabha] = useState(false);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    if (isOpen) {
      fetchTodayRavisabha();
    }
  }, [isOpen]);

  const fetchTodayRavisabha = async () => {
    setIsLoadingRavisabha(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const { data } = await axios.get('/api/ravisabha', {
        params: { startDate: todayStr, endDate: todayStr },
      });
      const ravisabhas = data.ravisabhas || [];
      if (ravisabhas.length > 0) {
        setTodayRavisabhaId(ravisabhas[0]._id);
      } else {
        setTodayRavisabhaId(null);
      }
    } catch {
      setTodayRavisabhaId(null);
    } finally {
      setIsLoadingRavisabha(false);
    }
  };

  const handleMarkAttendance = async () => {
    if (!authUser?.id) {
      toast.error('Authentication error. Please log in again.');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post('/api/attendance', {
        smkDetailId: candidateId,
        userId: authUser.id,
        ravisabhaId: todayRavisabhaId || undefined,
        SmkId: candidateSmkNo,
        name: candidateName,
        status: 'present',
        date: new Date().toISOString(),
        bhojan: true,
      });

      toast.success('Attendance marked successfully');
      await refreshRecords();
      // Signal that attendance was updated so any open attendance page refreshes
      window.dispatchEvent(new CustomEvent('attendance-updated'));
      sessionStorage.setItem('attendance-needs-refresh', '1');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error marking attendance:', error);
      const errorMessage = error.response?.data?.message || 'Failed to mark attendance';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Mark Attendance</h2>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-4">
          <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-4">
            <UserCheck className="h-8 w-8 text-gray-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-gray-900">{candidateName}</p>
              <p className="text-sm text-gray-500">{candidateSmkNo}</p>
            </div>
          </div>

          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            <p className="font-medium">Ravisabha Date</p>
            <p>{isLoadingRavisabha ? 'Loading...' : today}</p>
          </div>

          {!isLoadingRavisabha && !todayRavisabhaId && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              No ravisabha found for today. Attendance will still be recorded but may not count toward the 3-ravisabha requirement.
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-sm">
            <span className="text-gray-600">Attendance Count after marking</span>
            <span className="font-semibold text-gray-900">
              {currentAttendanceCount + 1}/3
            </span>
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleMarkAttendance}
            disabled={isSubmitting || isLoadingRavisabha}
            className="flex-1 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Marking...' : 'Mark Present'}
          </button>
        </div>
      </div>
    </div>
  );
}
