'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { AttendanceRecord } from '@/lib/types';

export interface RavisabhaCounts {
  male: number;
  female: number;
  bhojan: number;
  mehmanMale: number;
  mehmanFemale: number;
  total: number;
  records: AttendanceRecord[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

function mapRecord(r: any): AttendanceRecord {
  return {
    id: r.id,
    user: {
      id: r.userId,
      firstName: r.name.split(' ')[0] || '',
      middleName: r.name.split(' ').length > 2 ? r.name.split(' ')[1] : '',
      lastName: r.name.split(' ').slice(r.name.split(' ').length > 2 ? 2 : 1).join(' ') || '',
      smkNo: r.smkNo,
      mobileNo: r.mobileNo,
      firstNameGuj: '',
      middleNameGuj: '',
      lastNameGuj: '',
      gender: r.gender,
    },
    status: r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : 'Present',
    date: r.date,
    time: r.time,
    timestamp: r.date && r.time ? new Date(`${r.date}T${r.time}`).getTime() : 0,
    createdByUsername: r.createdByUsername,
  };
}

export function useRavisabhaCounts(ravisabhaId: string | null): RavisabhaCounts {
  const [data, setData] = useState({
    male: 0, female: 0, bhojan: 0,
    mehmanMale: 0, mehmanFemale: 0, total: 0,
    records: [] as AttendanceRecord[],
  });
  const [isLoading, setIsLoading] = useState(false);
  const ravisabhaIdRef = useRef(ravisabhaId);

  useEffect(() => {
    ravisabhaIdRef.current = ravisabhaId;
  }, [ravisabhaId]);

  const fetchCounts = useCallback(async (id: string | null = ravisabhaIdRef.current) => {
    if (!id) return;
    setIsLoading(true);
    try {
      const { data: result } = await axios.get('/api/counts', { params: { ravisabhaId: id } });
      setData({
        male: result.male,
        female: result.female,
        bhojan: result.bhojan,
        mehmanMale: result.mehmanMale,
        mehmanFemale: result.mehmanFemale,
        total: result.total,
        records: (result.records || []).map(mapRecord),
      });
    } catch (error) {
      console.error('Error fetching counts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch when ravisabhaId changes
  useEffect(() => {
    if (ravisabhaId) fetchCounts(ravisabhaId);
  }, [ravisabhaId, fetchCounts]);

  // Poll sessionStorage for cross-page refresh signal
  useEffect(() => {
    const interval = setInterval(() => {
      const id = ravisabhaIdRef.current;
      if (id && sessionStorage.getItem('attendance-needs-refresh') === '1') {
        sessionStorage.removeItem('attendance-needs-refresh');
        fetchCounts(id);
      }
    }, 800);
    return () => clearInterval(interval);
  }, [fetchCounts]);

  // Same-page refresh via custom event
  useEffect(() => {
    const handle = () => fetchCounts(ravisabhaIdRef.current);
    window.addEventListener('attendance-updated', handle);
    return () => window.removeEventListener('attendance-updated', handle);
  }, [fetchCounts]);

  return { ...data, isLoading, refresh: async () => { await fetchCounts(ravisabhaIdRef.current); } };
}
