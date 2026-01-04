'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { AttendanceRecord, AttendanceStatus } from '@/lib/types';
import axios from 'axios';

interface AttendanceContextType {
  records: AttendanceRecord[];
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
        }));

        setRecords(mappedRecords);
      } catch (error) {
        console.error('Error fetching today records:', error);
      }
  }

  useEffect(() => {
    // Clear records immediately when ravisabhaId changes to prevent showing stale data
    setRecords([]);
    fetchRecords();
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
    <AttendanceContext.Provider value={{ records, addRecord, updateRecordStatus, removeRecord, refreshRecords: fetchRecords }}>
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
