'use client';

import { useState, useMemo } from 'react';
import { useAttendance } from '@/components/AttendanceProvider';
import { cn, formatTo12Hour } from '@/lib/utils';
import { ArrowUpDown, ArrowUp, ArrowDown, Filter, X, ChevronLeft, ChevronRight, Trash2, RotateCw } from 'lucide-react';
import { toast } from 'sonner';
import { AttendanceRecord } from '@/lib/types';
import axios from 'axios';

type SortKey = 'name' | 'smkNo' | 'mobileNo' | 'dateTime' | 'status';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

interface AttendanceListProps {
  ravisabhaId?: string;
}

export default function AttendanceList({ ravisabhaId }: AttendanceListProps) {
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; recordId: string | null }>({
    isOpen: false,
    recordId: null,
  });

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmation({ isOpen: true, recordId: id });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.recordId) return;

    try {
      await axios.delete('/api/attendance', {
        params: {
          id: deleteConfirmation.recordId,
        },
      });
      removeRecord(deleteConfirmation.recordId);
      toast.success('Record deleted successfully');
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('Error deleting record');
    } finally {
      setDeleteConfirmation({ isOpen: false, recordId: null });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, recordId: null });
  };

  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'dateTime', direction: 'desc' });
  const [visibleFilters, setVisibleFilters] = useState<Record<string, boolean>>({});
  const [filters, setFilters] = useState({
    name: '',
    smkNo: '',
    mobileNo: '',
    date: '',
    status: 'All',
  });

  const { records, removeRecord, refreshRecords } = useAttendance();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [serverCounts, setServerCounts] = useState<{ male: number; female: number; total: number } | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Get current context (ravisabhaId or date)
      const params: any = {};
      if (ravisabhaId) {
        params.ravisabhaId = ravisabhaId;
      } else {
        const today = new Date().toISOString().split('T')[0];
        params.date = today;
      }

      const { data } = await axios.get('/api/attendance/stats', { params });
      setServerCounts(data);
      toast.success('Counts refreshed');
    } catch (error) {
      console.error('Error refreshing counts:', error);
      toast.error('Failed to refresh counts');
    } finally {
      setIsRefreshing(false);
    }
  };

  // ... (delete logic is already there)

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
    setServerCounts(null); // Clear server counts on filter clear to show derived counts
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

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const filteredAndSortedRecords = useMemo(() => {
    let result = [...records];

    // Filter
    if (filters.name) {
      const lowerName = filters.name.toLowerCase();
      result = result.filter(
        (r) =>
          r.user.firstName.toLowerCase().includes(lowerName) ||
          (r.user.middleName && r.user.middleName.toLowerCase().includes(lowerName)) ||
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
          aValue = `${a.user.firstName} ${a.user.middleName ? `${a.user.middleName} ` : ''}${a.user.lastName}`;
          bValue = `${b.user.firstName} ${b.user.middleName ? `${b.user.middleName} ` : ''}${b.user.lastName}`;
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

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown className="ml-1 h-3 w-3 text-gray-300" />;
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="ml-1 h-3 w-3 text-gray-900" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 text-gray-900" />
    );
  };

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

  const displayCounts = serverCounts || genderCounts;

  return (
    <>
      <div className="space-y-4">
        {/* ... (existing header code) ... */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Records</h2>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex sm:hidden items-center gap-2 rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <X className="h-3 w-3" />
                Clear Filters
              </button>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-3 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-100">
                <span>Male: <span className="font-medium text-gray-900">{displayCounts.male}</span></span>
                <span className="text-gray-300">|</span>
                <span>Female: <span className="font-medium text-gray-900">{displayCounts.female}</span></span>
                <span className="text-gray-300">|</span>
                <span>Total: <span className="font-medium text-gray-900">{displayCounts.total}</span></span>
              </div>
              <button 
                onClick={handleRefresh} 
                disabled={isRefreshing}
                className="flex h-8 items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:opacity-50 shadow-sm"
                title="Refresh Counts"
              >
                <RotateCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
                <span>Refresh</span>
              </button>


            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="hidden sm:flex items-center gap-2 rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <X className="h-3 w-3" />
                Clear Filters
              </button>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="pl-3 pr-1 py-3 font-medium align-top text-xs md:text-sm md:px-6 w-[35%] md:w-auto">
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
                  <th className="px-1 py-3 font-medium align-top text-xs md:text-sm md:px-6 w-[25%] md:w-auto">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSort('dateTime')}
                        className="flex items-center hover:text-gray-900"
                      >
                        Date <SortIcon columnKey="dateTime" />
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
                  <th className="px-1 py-3 font-medium align-top text-xs md:text-sm md:px-6 w-[25%] md:w-auto">
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
                  <th className="px-1 py-3 font-medium align-top text-xs md:text-sm md:px-6 w-[15%] md:w-auto text-center md:text-left">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedRecords.length > 0 ? (
                  paginatedRecords.map((record) => (
                    <tr key={record.id} className="group hover:bg-gray-50/50">
                      <td className="pl-3 pr-1 py-3 font-medium text-gray-900 text-xs md:text-sm md:px-6">
                        <div className="flex flex-col">
                          <span className="truncate max-w-[120px] md:max-w-none">{record.user.firstName}</span>
                          {record.user.middleName && (
                            <span className="truncate max-w-[120px] md:max-w-none md:mt-0.5">{record.user.middleName}</span>
                          )}
                          <span className="truncate max-w-[120px] md:max-w-none md:mt-0.5">{record.user.lastName}</span>
                        </div>
                      </td>
                      <td className="hidden px-1 py-3 text-gray-500 text-xs md:text-sm md:table-cell md:px-6">{record.user.smkNo}</td>
                      <td className="hidden px-1 py-3 text-gray-500 text-xs md:text-sm md:table-cell md:px-6">{record.user.mobileNo}</td>
                      <td className="px-1 py-3 text-gray-500 text-xs md:text-sm md:px-6">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-gray-900 md:font-normal md:text-gray-500">
                            {record.date.slice(2)} {/* Show YY-MM-DD */}
                          </span>
                          <span className="text-gray-500 text-[10px] md:text-sm">{formatTo12Hour(record.time)}</span>
                        </div>
                      </td>
                      <td className="px-1 py-3 text-center md:text-left md:px-6">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] md:text-xs font-medium",
                            record.status === 'Present'
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          )}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td className="px-1 py-3 text-center md:text-left md:px-6">
                        <button
                          onClick={() => handleDeleteClick(record.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors p-1.5 rounded-full hover:bg-red-50"
                          title="Delete Record"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No records match your filters.
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
                    {(() => {
                      const paginationRange = [];
                      const siblingCount = 2;

                      if (totalPages <= 7) {
                        for (let i = 1; i <= totalPages; i++) {
                          paginationRange.push(i);
                        }
                      } else {
                        paginationRange.push(1);

                        const startPage = Math.max(2, currentPage - siblingCount);
                        const endPage = Math.min(totalPages - 1, currentPage + siblingCount);

                        if (startPage > 2) {
                          paginationRange.push('...');
                        }

                        for (let i = startPage; i <= endPage; i++) {
                          paginationRange.push(i);
                        }

                        if (endPage < totalPages - 1) {
                          paginationRange.push('...');
                        }

                        if (totalPages > 1) {
                          paginationRange.push(totalPages);
                        }
                      }

                      return paginationRange.map((page, index) => {
                        if (page === '...') {
                          return (
                            <span
                              key={`ellipsis-${index}`}
                              className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0"
                            >
                              ...
                            </span>
                          );
                        }

                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page as number)}
                            className={cn(
                              "relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus:outline-offset-0",
                              page === currentPage
                                ? "z-10 bg-black text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                                : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                            )}
                          >
                            {page}
                          </button>
                        );
                      });
                    })()}
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="rounded-full bg-red-100 p-3">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">Delete Record</h3>
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this attendance record?
                </p>
              </div>
              <div className="flex w-full gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
