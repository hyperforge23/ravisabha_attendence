'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { AttendanceRecord, AttendanceStatus } from '@/lib/types';
import axios from 'axios';
import { useRavisabhaCounts } from '@/hooks/useRavisabhaCounts';

interface AttendanceContextType {
  records: AttendanceRecord[];
  preAttendanceStatus: Record<string, 'Present' | 'Absent'>;
  showPreAttendance: boolean;
  male: number;
  female: number;
  bhojan: number;
  mehmanMale: number;
  mehmanFemale: number;
  total: number;
  isLoadingCounts: boolean;
  addRecord: (record: AttendanceRecord) => void;
  updateRecordStatus: (id: string, status: AttendanceStatus) => void;
  removeRecord: (id: string) => void;
  refreshRecords: () => Promise<void>;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const ravisabhaId = searchParams?.get('ravisabhaId') ?? null;
  const [preAttendanceStatus, setPreAttendanceStatus] = useState<Record<string, 'Present' | 'Absent'>>({});

  const counts = useRavisabhaCounts(ravisabhaId);

  const fetchPreAttendance = async () => {
    if (!ravisabhaId) { setPreAttendanceStatus({}); return; }
    try {
      const { data } = await axios.get('/api/pre-attendance', { params: { ravisabhaId } });
      const statusMap: Record<string, 'Present' | 'Absent'> = {};
      for (const record of data.records || []) {
        const id = record.smkDetailId ? String(record.smkDetailId) : '';
        if (!id) continue;
        if (record.status === 'Present' || record.status === 'Absent') {
          statusMap[id] = record.status;
        }
      }
      setPreAttendanceStatus(statusMap);
    } catch {
      setPreAttendanceStatus({});
    }
  };

  useEffect(() => {
    setPreAttendanceStatus({});
    fetchPreAttendance();
  }, [ravisabhaId]);

  const addRecord = (record: AttendanceRecord) => {
    // Trigger a refresh to get fresh data from server
    counts.refresh();
  };

  const updateRecordStatus = (id: string, status: AttendanceStatus) => {
    counts.refresh();
  };

  const removeRecord = (id: string) => {
    counts.refresh();
  };

  return (
    <AttendanceContext.Provider value={{
      records: counts.records,
      preAttendanceStatus,
      showPreAttendance: Boolean(ravisabhaId),
      male: counts.male,
      female: counts.female,
      bhojan: counts.bhojan,
      mehmanMale: counts.mehmanMale,
      mehmanFemale: counts.mehmanFemale,
      total: counts.total,
      isLoadingCounts: counts.isLoading,
      addRecord,
      updateRecordStatus,
      removeRecord,
      refreshRecords: counts.refresh,
    }}>
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const context = useContext(AttendanceContext);
  if (context === undefined) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
}
