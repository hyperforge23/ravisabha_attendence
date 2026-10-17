'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { AttendanceRecord, AttendanceStatus } from '@/lib/types';
import axios from 'axios';

interface AttendanceContextType {
  records: AttendanceRecord[];
  preAttendanceStatus: Record<string, "Present" | "Absent">;
  showPreAttendance: boolean;
  addRecord: (record: AttendanceRecord) => void;
  updateRecordStatus: (id: string, status: AttendanceStatus) => void;
  removeRecord: (id: string) => void;
  refreshRecords: () => Promise<void>;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const ravisabhaId = searchParams?.get('ravisabhaId');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [preAttendanceStatus, setPreAttendanceStatus] = useState<Record<string, "Present" | "Absent">>({});

  const fetchPreAttendance = async () => {
    if (!ravisabhaId) {
      setPreAttendanceStatus({});
      return;
    }

    try {
      const { data } = await axios.get('/api/pre-attendance', {
        params: { ravisabhaId },
      });

      const statusMap: Record<string, "Present" | "Absent"> = {};
      for (const record of data.records || []) {
        const smkDetailId = record.smkDetailId ? String(record.smkDetailId) : "";
        if (!smkDetailId) continue;
        if (record.status === "Present" || record.status === "Absent") {
          statusMap[smkDetailId] = record.status;
        }
      }
      setPreAttendanceStatus(statusMap);
    } catch (error) {
      console.error('Error fetching pre-attendance status:', error);
      setPreAttendanceStatus({});
    }
  };

  const fetchRecords = async () => {
      try {
        const params: any = {};
        
        if (ravisabhaId) {
          params.ravisabhaId = ravisabhaId;
        } else {
          // If no ravisabhaId, fetch today's records
          const today = new Date().toISOString().split('T')[0];
          params.date = today;
        }
        
        const { data } = await axios.get('/api/attendance', { params });
        
        // Map DB records to frontend AttendanceRecord type
        const mappedRecords: AttendanceRecord[] = data.records.map((record: any) => ({
          id: record._id,
          user: {
            id: record.smkDetailId._id,
            firstName: record.smkDetailId.FirstName,
            middleName: record.smkDetailId.MiddleName,
            lastName: record.smkDetailId.LastName,
            smkNo: record.smkDetailId.SmkId,
            mobileNo: record.smkDetailId.MobileNo?.toString() || '',
            firstNameGuj: record.smkDetailId.FirstNameGuj,
            middleNameGuj: record.smkDetailId.MiddleNameGuj,
            lastNameGuj: record.smkDetailId.LastNameGuj,
            gender: record.smkDetailId.Gender?.toString(),
          },
          status: record.status.charAt(0).toUpperCase() + record.status.slice(1), // Capitalize
          date: record.date.split('T')[0],
          time: new Date(record.date).toTimeString().slice(0, 5),
          timestamp: new Date(record.date).getTime(),
          createdByUsername: record.userId?.UserName || '',
        }));

        setRecords(mappedRecords);
      } catch (error) {
        console.error('Error fetching today records:', error);
      }
  }

  useEffect(() => {
    // Clear records immediately when ravisabhaId changes to prevent showing stale data
    setRecords([]);
    setPreAttendanceStatus({});
    fetchRecords();
    fetchPreAttendance();
}, [ravisabhaId]);

  const addRecord = (record: AttendanceRecord) => {
    setRecords((prev) => [record, ...prev]);
  };

  const updateRecordStatus = (id: string, status: AttendanceStatus) => {
    setRecords((prev) =>
      prev.map((rec) => (rec.id === id ? { ...rec, status } : rec))
    );
  };

  const removeRecord = (id: string) => {
    setRecords((prev) => prev.filter((rec) => rec.id !== id));
  };

  return (
    <AttendanceContext.Provider value={{ records, preAttendanceStatus, showPreAttendance: Boolean(ravisabhaId), addRecord, updateRecordStatus, removeRecord, refreshRecords: async () => { await Promise.all([fetchRecords(), fetchPreAttendance()]); } }}>
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
