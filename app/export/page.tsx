'use client';

import { useState, useEffect, useMemo } from 'react';
import { AttendanceRecord, User as UserType } from '@/lib/types';
import { downloadCSV } from '@/lib/csv';
import { cn, formatTo12Hour, formatIndianCurrency } from '@/lib/utils';
import { Download, ArrowUpDown, ArrowUp, ArrowDown, Filter, X, ChevronLeft, ChevronRight, ArrowLeft, ArrowRight, Calendar, User, Utensils, StickyNote } from 'lucide-react';
import SearchSection from '@/components/SearchSection';
import axios from 'axios';

type SortKey = 'name' | 'smkNo' | 'mobileNo' | 'dateTime' | 'status';
type SortDirection = 'asc' | 'desc';
type DateRange = 'this-month' | 'last-3-months' | 'last-6-months' | 'last-1-year' | 'custom';
type TabType = 'ravisabha' | 'person';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

interface Ravisabha {
  _id: string;
  date: string;
  prasad?: string;
  expense?: number;
  yajman?: string;
  notes?: string;
  attendanceCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export default function ExportPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('ravisabha');
  
  const [selectedRavisabha, setSelectedRavisabha] = useState<Ravisabha | null>(null);
  const [ravisabhas, setRavisabhas] = useState<Ravisabha[]>([]);
  const [isLoadingRavisabhas, setIsLoadingRavisabhas] = useState(true);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [exportingRavisabhaId, setExportingRavisabhaId] = useState<string | null>(null);
  
  // Person search state
  const [selectedPerson, setSelectedPerson] = useState<UserType | null>(null);
  const [personAttendanceStats, setPersonAttendanceStats] = useState<{
    attended: number;
    total: number;
    percentage: number;
  } | null>(null);
  const [isLoadingPersonStats, setIsLoadingPersonStats] = useState(false);
  
  // Date range filter state
  const [dateRange, setDateRange] = useState<DateRange>('this-month');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

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

  // Helper function to get date range
  const getDateRange = (): { startDate: Date; endDate: Date } => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    if (dateRange === 'custom') {
      const [yearStr, monthStr] = selectedMonth.split('-');
      startDate = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
      endDate = new Date(parseInt(yearStr), parseInt(monthStr), 0, 23, 59, 59, 999);
    } else {
      switch (dateRange) {
        case 'this-month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          break;
        case 'last-3-months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
          endDate = new Date();
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'last-6-months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
          endDate = new Date();
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'last-1-year':
          startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
          endDate = new Date();
          endDate.setHours(23, 59, 59, 999);
          break;
      }
    }

    return { startDate, endDate };
  };

  // Fetch person attendance stats
  useEffect(() => {
    const fetchPersonAttendanceStats = async () => {
      if (!selectedPerson) {
        setPersonAttendanceStats(null);
        return;
      }

      setIsLoadingPersonStats(true);
      try {
        const { startDate, endDate } = getDateRange();

        // Fetch all ravisabhas in the date range
        let params: any = {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        };

        const { data: ravisabhaData } = await axios.get('/api/ravisabha', { params });
        const ravisabhasInRange = ravisabhaData.ravisabhas || [];
        const totalRavisabhas = ravisabhasInRange.length;

        if (totalRavisabhas === 0) {
          setPersonAttendanceStats({ attended: 0, total: 0, percentage: 0 });
          setIsLoadingPersonStats(false);
          return;
        }

        // Fetch attendance records for this person in the date range
        const { data: attendanceData } = await axios.get('/api/attendance', {
          params: {
            smkDetailId: selectedPerson.id,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        });

        const attendanceRecords = attendanceData.records || [];
        // Count unique ravisabhas the person attended (status = "present")
        const attendedRavisabhaIds = new Set(
          attendanceRecords
            .filter((record: any) => record.status?.toLowerCase() === 'present' && record.ravisabhaId)
            .map((record: any) => record.ravisabhaId.toString())
        );
        const attendedRavisabhas = attendedRavisabhaIds.size;

        const percentage = totalRavisabhas > 0 
          ? Math.round((attendedRavisabhas / totalRavisabhas) * 100) 
          : 0;

        setPersonAttendanceStats({
          attended: attendedRavisabhas,
          total: totalRavisabhas,
          percentage,
        });
      } catch (error) {
        console.error('Error fetching person attendance stats:', error);
        setPersonAttendanceStats(null);
      } finally {
        setIsLoadingPersonStats(false);
      }
    };

    fetchPersonAttendanceStats();
  }, [selectedPerson, dateRange, selectedMonth]);

  // Fetch ravisabhas
  useEffect(() => {
    const fetchRavisabhas = async () => {
      setIsLoadingRavisabhas(true);
      try {
        let params: any = {};
        const { startDate, endDate } = getDateRange();
        
        if (dateRange === 'custom') {
          // Use month selector for custom
          params.month = selectedMonth;
        } else {
          params.startDate = startDate.toISOString();
          params.endDate = endDate.toISOString();
        }

        const { data } = await axios.get('/api/ravisabha', { params });
        setRavisabhas(data.ravisabhas || []);
        // Clear selected ravisabha when filter changes
        setSelectedRavisabha(null);
      } catch (error) {
        console.error('Error fetching ravisabhas:', error);
      } finally {
        setIsLoadingRavisabhas(false);
      }
    };

    fetchRavisabhas();
  }, [dateRange, selectedMonth]);

  // Fetch attendance records when ravisabha is selected
  useEffect(() => {
    if (!selectedRavisabha) {
      setRecords([]);
      return;
    }

    const fetchRecords = async () => {
      setIsLoading(true);
      try {
        const { data } = await axios.get('/api/attendance', {
          params: {
            ravisabhaId: selectedRavisabha._id,
          },
        });
        
        if (!data || !data.records) {
          setRecords([]);
          return;
        }
        
        const mappedRecords: AttendanceRecord[] = data.records
          .filter((record: any) => record.smkDetailId) // Filter out records without populated smkDetailId
          .map((record: any) => ({
            id: record._id,
            user: {
              id: record.smkDetailId._id,
              firstName: record.smkDetailId.FirstName,
              middleName: record.smkDetailId.MiddleName,
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
  }, [selectedRavisabha]);

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

  const handleExportRavisabha = async (ravisabhaId: string) => {
    setExportingRavisabhaId(ravisabhaId);
    try {
      const { data } = await axios.get('/api/attendance', {
        params: {
          ravisabhaId: ravisabhaId,
        },
      });
      
      if (!data || !data.records) {
        return;
      }
      
      const mappedRecords: AttendanceRecord[] = data.records
        .filter((record: any) => record.smkDetailId)
        .map((record: any) => ({
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

      downloadCSV(mappedRecords);
    } catch (error) {
      console.error('Error exporting ravisabha records:', error);
    } finally {
      setExportingRavisabhaId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Show ravisabha list if none selected
  if (!selectedRavisabha) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Reports</h1>
        </div>

        {/* Shared Date Range Filters */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              {[
                { id: 'this-month', label: 'This Month' },
                { id: 'last-3-months', label: 'Last 3 Months' },
                { id: 'last-6-months', label: 'Last 6 Months' },
                { id: 'last-1-year', label: 'Last 1 Year' },
                { id: 'custom', label: 'Custom' },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => setDateRange(option.id as DateRange)}
                  className={cn(
                    "rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-all",
                    dateRange === option.id
                      ? "bg-black text-white shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {dateRange === 'custom' && (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="relative w-full sm:w-auto">
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">Filter by Month</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 py-2 text-sm text-gray-900 focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-4 sm:space-x-8" aria-label="Tabs">
            {[
              { id: 'ravisabha', label: 'Ravisabha' },
              { id: 'person', label: 'Person' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={cn(
                  "whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "border-black text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'ravisabha' && (
            <div className="space-y-6">

              {isLoadingRavisabhas ? (
                <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
                  <div className="text-center text-gray-500">Loading ravisabhas...</div>
                </div>
              ) : ravisabhas.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
                  <div className="text-center text-gray-500">No ravisabhas found.</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {ravisabhas.map((ravisabha) => (
                    <div
                      key={ravisabha._id}
                      className="group relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-black hover:shadow-md"
                    >
                      <button
                        onClick={() => setSelectedRavisabha(ravisabha)}
                        className="w-full text-left"
                      >
                        <div className="flex-1">
                          <div className="mb-2">
                            <span className="text-sm font-medium text-gray-500">{formatDateShort(ravisabha.date)}</span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">{formatDate(ravisabha.date)}</h3>
                          <div className="mb-3 pb-3 border-b border-gray-100">
                            <div className="text-sm font-medium text-gray-700">
                              <span>Attendance:</span>
                              <span className="text-gray-900"> {ravisabha.attendanceCount || 0}</span>
                            </div>
                          </div>
                          {ravisabha.yajman && (
                            <div className="text-sm text-gray-600 mb-1">
                              <span className="font-medium">Yajman:</span> {ravisabha.yajman}
                            </div>
                          )}
                          {ravisabha.prasad && (
                            <div className="text-sm text-gray-600 mb-1">
                              <span className="font-medium">Prasad:</span> {ravisabha.prasad}
                            </div>
                          )}
                          {ravisabha.expense && (
                            <div className="text-sm text-gray-600 mb-1">
                              <span className="font-medium">Expense:</span> ₹{formatIndianCurrency(ravisabha.expense)}
                            </div>
                          )}
                          {ravisabha.notes && (
                            <div className="text-sm text-gray-600 mt-2">
                              <span className="line-clamp-2">{ravisabha.notes}</span>
                            </div>
                          )}
                        </div>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportRavisabha(ravisabha._id);
                        }}
                        disabled={exportingRavisabhaId === ravisabha._id}
                        className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Download className="h-4 w-4" />
                        {exportingRavisabhaId === ravisabha._id ? 'Exporting...' : 'Export'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'person' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
                <div className="space-y-4">
                  {/* Person Search Section */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Search by Person</label>
                    <SearchSection onSelectUser={(user) => setSelectedPerson(user)} />
                    
                    {selectedPerson && (
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={() => setSelectedPerson(null)}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <span className="text-sm text-gray-700">
                          Selected: <span className="font-medium text-gray-900">
                            {selectedPerson.firstName} {selectedPerson.lastName}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Person Attendance Statistics */}
                  {selectedPerson && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      {isLoadingPersonStats ? (
                        <div className="text-sm text-gray-500">Loading attendance statistics...</div>
                      ) : personAttendanceStats ? (
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-gray-700">Attendance Statistics</div>
                          <div className="flex items-baseline gap-3">
                            <div className="text-2xl font-bold text-gray-900">
                              {personAttendanceStats.attended}/{personAttendanceStats.total}
                            </div>
                            <div className="text-lg font-semibold text-gray-600">
                              ({personAttendanceStats.percentage}%)
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {selectedPerson.firstName} {selectedPerson.lastName} attended {personAttendanceStats.attended} out of {personAttendanceStats.total} Ravi Sabha sessions in the selected period.
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">No attendance data available.</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show attendance details for selected ravisabha
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="space-y-2">
        <button
          onClick={() => setSelectedRavisabha(null)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Reports
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Reports</h1>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-500">{formatDateShort(selectedRavisabha.date)}</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">{formatDate(selectedRavisabha.date)}</h2>
          {selectedRavisabha.yajman && (
            <div className="text-sm text-gray-600 mt-1">
              <span className="font-medium">Yajman:</span> {selectedRavisabha.yajman}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
          Attendance Records <span className="text-sm font-normal text-gray-500">({filteredAndSortedRecords.length} records)</span>
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
                    No records found for this ravisabha.
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
