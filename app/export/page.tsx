'use client';

import { useState, useEffect, useMemo } from 'react';
import { AttendanceRecord } from '@/lib/types';
import { downloadCSV } from '@/lib/csv';
import { cn, formatTo12Hour } from '@/lib/utils';
import { Download, Calendar as CalendarIcon, ArrowUpDown, ArrowUp, ArrowDown, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';

type DateRange = 'this-month' | 'last-3-months' | 'last-6-months' | 'custom';
type SortKey = 'name' | 'smkNo' | 'mobileNo' | 'dateTime' | 'status';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

export default function ExportPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [range, setRange] = useState<DateRange>('this-month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Sorting and Filtering State
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'dateTime', direction: 'desc' });
  const [visibleFilters, setVisibleFilters] = useState<Record<string, boolean>>({});
  const [filters, setFilters] = useState({
    name: '',
    smkNo: '',
    mobileNo: '',
    date: '',
    status: 'All',
  });
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    const fetchRecords = async () => {
      let start = new Date();
      let end = new Date();

      if (range === 'custom') {
        if (!startDate || !endDate) return;
        start = new Date(startDate);
        end = new Date(endDate);
      } else {
        // Set end date to today
        end = new Date();
        
        // Calculate start date based on range
        start = new Date();
        if (range === 'this-month') {
          start.setDate(1); // First day of current month
        } else if (range === 'last-3-months') {
          start.setMonth(start.getMonth() - 3);
        } else if (range === 'last-6-months') {
          start.setMonth(start.getMonth() - 6);
        }
      }

      setIsLoading(true);
      try {
        const queryStart = start.toISOString().split('T')[0];
        const queryEnd = end.toISOString().split('T')[0];
        
        const { data } = await axios.get('/api/attendance', {
          params: {
            startDate: queryStart,
            endDate: queryEnd,
          },
        });
        
        const mappedRecords: AttendanceRecord[] = data.records.map((record: any) => ({
          id: record._id,
          user: {
            id: record.smkDetailId._id,
            firstName: record.smkDetailId.FirstName,
            lastName: record.smkDetailId.LastName,
            smkNo: record.smkDetailId.SmkId,
            mobileNo: record.smkDetailId.MobileNo?.toString() || '',
            firstNameGuj: record.smkDetailId.FirstNameGuj,
            lastNameGuj: record.smkDetailId.LastNameGuj,
            gender: record.smkDetailId.Gender?.toString(),
          },
          status: record.status.charAt(0).toUpperCase() + record.status.slice(1),
          date: record.date.split('T')[0],
          time: new Date(record.date).toTimeString().slice(0, 5),
          timestamp: new Date(record.date).getTime(),
        }));

        setRecords(mappedRecords);
      } catch (error) {
        console.error('Error fetching export records:', error);
        setRecords([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecords();
  }, [range, startDate, endDate]);

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
    setCurrentPage(1);
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

  const totalPages = Math.ceil(filteredAndSortedRecords.length / itemsPerPage);
  const paginatedRecords = filteredAndSortedRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const genderCounts = useMemo(() => {
    const counts = { male: 0, female: 0, total: filteredAndSortedRecords.length };
    filteredAndSortedRecords.forEach((record) => {
      const gender = record.user.gender?.toString().toLowerCase();
      if (gender === '1' || gender === 'male' || gender === 'm') {
        counts.male++;
      } else if (gender === '2' || gender === 'female' || gender === 'f') {
        counts.female++;
      }
    });
    return counts;
  }, [filteredAndSortedRecords]);

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown className="ml-1 h-3 w-3 text-gray-300" />;
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="ml-1 h-3 w-3 text-gray-900" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 text-gray-900" />
    );
  };

  const handleExport = () => {
    downloadCSV(filteredAndSortedRecords);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Export Data</h1>
        <p className="text-sm sm:text-base text-gray-500">Export attendance records based on selected time range.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:gap-6">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
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
                  "rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-all",
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
              <div className="relative w-full sm:w-auto">
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
              <div className="relative w-full sm:w-auto">
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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
          Preview <span className="text-sm font-normal text-gray-500">({filteredAndSortedRecords.length} records)</span>
        </h2>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex items-center gap-3 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-100 self-start sm:self-auto">
            <span>Male: <span className="font-medium text-gray-900">{genderCounts.male}</span></span>
            <span className="text-gray-300">|</span>
            <span>Female: <span className="font-medium text-gray-900">{genderCounts.female}</span></span>
            <span className="text-gray-300">|</span>
            <span>Total: <span className="font-medium text-gray-900">{genderCounts.total}</span></span>
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center justify-center gap-2 rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <X className="h-3 w-3" />
                Clear Filters
              </button>
            )}
            <button
              onClick={handleExport}
              disabled={filteredAndSortedRecords.length === 0 || isLoading}
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {isLoading ? 'Loading...' : 'Export CSV'}
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium sm:px-6">
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
                <th className="hidden px-6 py-3 font-medium md:table-cell">
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
                <th className="hidden px-6 py-3 font-medium md:table-cell">
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
                <th className="px-4 py-3 font-medium sm:px-6">
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
                <th className="px-4 py-3 font-medium sm:px-6">
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
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Loading records...
                  </td>
                </tr>
              ) : paginatedRecords.length > 0 ? (
                paginatedRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-4 font-medium text-gray-900 sm:px-6">
                      <div className="flex flex-col">
                        <span>{record.user.firstName} {record.user.lastName}</span>
                        <span className="text-xs text-gray-400 md:hidden">SMK: {record.user.smkNo}</span>
                      </div>
                    </td>
                    <td className="hidden px-6 py-4 text-gray-500 md:table-cell">{record.user.smkNo}</td>
                    <td className="hidden px-6 py-4 text-gray-500 md:table-cell">{record.user.mobileNo}</td>
                    <td className="px-4 py-4 text-gray-500 sm:px-6">
                      <div className="flex flex-col sm:block">
                        <span>{record.date}</span>
                        <span className="hidden text-gray-300 sm:inline"> | </span>
                        <span className="text-xs sm:text-sm">{formatTo12Hour(record.time)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 sm:px-6">
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
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, filteredAndSortedRecords.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredAndSortedRecords.length}</span> results
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        "relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus:outline-offset-0",
                        page === currentPage
                          ? "z-10 bg-black text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                          : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                      )}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
