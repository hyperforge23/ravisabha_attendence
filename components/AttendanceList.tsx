'use client';

import { useState, useMemo } from 'react';
import { useAttendance } from '@/components/AttendanceProvider';
import { cn, formatTo12Hour } from '@/lib/utils';
import { ArrowUpDown, ArrowUp, ArrowDown, Filter, X } from 'lucide-react';
import { AttendanceRecord } from '@/lib/types';

type SortKey = 'name' | 'smkNo' | 'mobileNo' | 'dateTime' | 'status';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

export default function AttendanceList() {
  const { records, updateRecordStatus } = useAttendance();
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'dateTime', direction: 'desc' });
  const [visibleFilters, setVisibleFilters] = useState<Record<string, boolean>>({});
  const [filters, setFilters] = useState({
    name: '',
    smkNo: '',
    mobileNo: '',
    date: '',
    status: 'All',
  });

  const handleSort = (key: SortKey) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const toggleFilter = (key: string) => {
    setVisibleFilters((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const clearFilters = () => {
    setFilters({
      name: '',
      smkNo: '',
      mobileNo: '',
      date: '',
      status: 'All',
    });
    setVisibleFilters({});
    setSortConfig({ key: 'dateTime', direction: 'desc' });
  };

  const hasActiveFilters = useMemo(() => {
    const isFilterActive =
      filters.name !== '' ||
      filters.smkNo !== '' ||
      filters.mobileNo !== '' ||
      filters.date !== '' ||
      filters.status !== 'All';

    const isSortActive = sortConfig.key !== 'dateTime' || sortConfig.direction !== 'desc';

    return isFilterActive || isSortActive;
  }, [filters, sortConfig]);

  const filteredAndSortedRecords = useMemo(() => {
    let result = [...records];

    // Filter
    if (filters.name) {
      const lowerName = filters.name.toLowerCase();
      result = result.filter(
        (r) =>
          r.user.firstName.toLowerCase().includes(lowerName) ||
          r.user.lastName.toLowerCase().includes(lowerName)
      );
    }
    if (filters.smkNo) {
      const lowerSmk = filters.smkNo.toLowerCase();
      result = result.filter((r) => r.user.smkNo.toLowerCase().includes(lowerSmk));
    }
    if (filters.mobileNo) {
      result = result.filter((r) => r.user.mobileNo.includes(filters.mobileNo));
    }
    if (filters.date) {
      result = result.filter((r) => r.date === filters.date);
    }
    if (filters.status !== 'All') {
      result = result.filter((r) => r.status === filters.status);
    }

    // Sort
    result.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortConfig.key) {
        case 'name':
          aValue = `${a.user.firstName} ${a.user.lastName}`;
          bValue = `${b.user.firstName} ${b.user.lastName}`;
          break;
        case 'smkNo':
          aValue = a.user.smkNo;
          bValue = b.user.smkNo;
          break;
        case 'mobileNo':
          aValue = a.user.mobileNo;
          bValue = b.user.mobileNo;
          break;
        case 'dateTime':
          aValue = a.timestamp;
          bValue = b.timestamp;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [records, filters, sortConfig]);

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown className="ml-1 h-3 w-3 text-gray-300" />;
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="ml-1 h-3 w-3 text-gray-900" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 text-gray-900" />
    );
  };

  if (records.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center">
        <p className="text-sm text-gray-500">No records added yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Today's Records</h2>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <X className="h-3 w-3" />
            Clear Filters
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="pl-3 pr-1 py-3 font-medium align-top text-xs md:text-sm md:px-6">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center hover:text-gray-900"
                    >
                      Name <SortIcon columnKey="name" />
                    </button>
                    <button onClick={() => toggleFilter('name')} className="p-1 hover:text-gray-900">
                      <Filter className={cn("h-3 w-3", filters.name ? "text-black fill-black" : "text-gray-400")} />
                    </button>
                  </div>
                  {visibleFilters.name && (
                    <input
                      type="text"
                      placeholder="Filter..."
                      value={filters.name}
                      onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                      className="mt-2 w-full rounded border border-gray-200 px-2 py-1 text-xs font-normal focus:border-black focus:outline-none"
                      autoFocus
                    />
                  )}
                </th>
                <th className="hidden px-1 py-3 font-medium align-top text-xs md:text-sm md:table-cell md:px-6">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSort('smkNo')}
                      className="flex items-center hover:text-gray-900"
                    >
                      SMK No <SortIcon columnKey="smkNo" />
                    </button>
                    <button onClick={() => toggleFilter('smkNo')} className="p-1 hover:text-gray-900">
                      <Filter className={cn("h-3 w-3", filters.smkNo ? "text-black fill-black" : "text-gray-400")} />
                    </button>
                  </div>
                  {visibleFilters.smkNo && (
                    <input
                      type="text"
                      placeholder="Filter..."
                      value={filters.smkNo}
                      onChange={(e) => setFilters({ ...filters, smkNo: e.target.value })}
                      className="mt-2 w-full rounded border border-gray-200 px-2 py-1 text-xs font-normal focus:border-black focus:outline-none"
                      autoFocus
                    />
                  )}
                </th>
                <th className="hidden px-1 py-3 font-medium align-top text-xs md:text-sm md:table-cell md:px-6">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSort('mobileNo')}
                      className="flex items-center hover:text-gray-900"
                    >
                      Mobile <SortIcon columnKey="mobileNo" />
                    </button>
                    <button onClick={() => toggleFilter('mobileNo')} className="p-1 hover:text-gray-900">
                      <Filter className={cn("h-3 w-3", filters.mobileNo ? "text-black fill-black" : "text-gray-400")} />
                    </button>
                  </div>
                  {visibleFilters.mobileNo && (
                    <input
                      type="text"
                      placeholder="Filter..."
                      value={filters.mobileNo}
                      onChange={(e) => setFilters({ ...filters, mobileNo: e.target.value })}
                      className="mt-2 w-full rounded border border-gray-200 px-2 py-1 text-xs font-normal focus:border-black focus:outline-none"
                      autoFocus
                    />
                  )}
                </th>
                <th className="px-1 py-3 font-medium align-top text-xs md:text-sm md:px-6">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSort('dateTime')}
                      className="flex items-center hover:text-gray-900"
                    >
                      Date & Time <SortIcon columnKey="dateTime" />
                    </button>
                    <button onClick={() => toggleFilter('date')} className="p-1 hover:text-gray-900">
                      <Filter className={cn("h-3 w-3", filters.date ? "text-black fill-black" : "text-gray-400")} />
                    </button>
                  </div>
                  {visibleFilters.date && (
                    <input
                      type="date"
                      value={filters.date}
                      onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                      className="mt-2 w-full rounded border border-gray-200 px-2 py-1 text-xs font-normal focus:border-black focus:outline-none"
                      autoFocus
                    />
                  )}
                </th>
                <th className="px-1 py-3 font-medium align-top text-xs md:text-sm md:px-6">
                  <div className="flex items-center justify-center gap-1 md:justify-start">
                    <button
                      onClick={() => handleSort('status')}
                      className="flex items-center hover:text-gray-900"
                    >
                      Status <SortIcon columnKey="status" />
                    </button>
                    <button onClick={() => toggleFilter('status')} className="p-1 hover:text-gray-900">
                      <Filter className={cn("h-3 w-3", filters.status !== 'All' ? "text-black fill-black" : "text-gray-400")} />
                    </button>
                  </div>
                  {visibleFilters.status && (
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      className="mt-2 w-full rounded border border-gray-200 px-2 py-1 text-xs font-normal focus:border-black focus:outline-none"
                      autoFocus
                    >
                      <option value="All">All</option>
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                    </select>
                  )}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAndSortedRecords.length > 0 ? (
                filteredAndSortedRecords.map((record) => (
                  <tr key={record.id} className="group hover:bg-gray-50/50">
                    <td className="max-w-[80px] truncate pl-3 pr-1 py-4 font-medium text-gray-900 text-xs md:text-sm md:max-w-none md:px-6">
                      {record.user.firstName} {record.user.lastName}
                    </td>
                    <td className="hidden px-1 py-4 text-gray-500 text-xs md:text-sm md:table-cell md:px-6">{record.user.smkNo}</td>
                    <td className="hidden px-1 py-4 text-gray-500 text-xs md:text-sm md:table-cell md:px-6">{record.user.mobileNo}</td>
                    <td className="px-1 py-4 text-gray-500 text-xs md:text-sm md:px-6">
                      <div className="flex flex-wrap items-center gap-1 sm:block">
                        <span className="font-medium text-gray-900 sm:font-normal sm:text-gray-500">{record.date}</span>
                        <span className="text-gray-300 mx-1 sm:mx-2">|</span>
                        <span className="text-gray-500">{formatTo12Hour(record.time)}</span>
                      </div>
                    </td>
                    <td className="px-1 py-4 text-center md:text-left md:px-6">
                      <button
                        onClick={() =>
                          updateRecordStatus(
                            record.id,
                            record.status === 'Present' ? 'Absent' : 'Present'
                          )
                        }
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-all hover:scale-105 active:scale-95 cursor-pointer",
                          record.status === 'Present'
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-red-100 text-red-800 hover:bg-red-200"
                        )}
                        title="Click to toggle status"
                      >
                        {record.status}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No records match your filters.
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
