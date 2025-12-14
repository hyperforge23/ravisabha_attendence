'use client';

import { useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { useAttendance } from '@/components/AttendanceProvider';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { Calendar, Clock, Edit2, Trash2, X } from 'lucide-react';
import axios from 'axios';
import AddUserModal from './AddUserModal';

interface UserCardProps {
  user: User | null;
  ravisabhaId?: string;
  onClear: () => void;
  onUserUpdated?: (user: User) => void;
}

export default function UserCard({
  user,
  ravisabhaId,
  onClear,
  onUserUpdated,
}: UserCardProps) {
  const { addRecord, records } = useAttendance();
  const { user: authUser } = useAuth();

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const now = new Date();
    setDate(now.toISOString().split('T')[0]);
    setTime(now.toTimeString().slice(0, 5));
  }, []);

  const handleSubmit = async () => {
    if (!date || !time || !authUser || !user) return;

    const isDuplicate = records.some(
      (record) => record.user.id === user.id && record.date === date
    );

    if (isDuplicate) {
      toast.error('Already added');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await axios.post('/api/attendance', {
        smkDetailId: user.id,
        userId: authUser.id,
        ravisabhaId: ravisabhaId || undefined,
        SmkId: user.smkNo,
        name: `${user.firstName} ${user.middleName ? `${user.middleName} ` : ''}${user.lastName}`,
        status: 'present',
        date: new Date(`${date}T${time}`),
      });

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

  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleUserUpdated = (updatedUser: User) => {
    toast.success('User updated successfully');
    if (onUserUpdated) {
      onUserUpdated(updatedUser);
    }
  };

  const handleDelete = async () => {
    if (!user) return;

    setIsDeleting(true);
    try {
      await axios.delete(`/api/users/${user.id}`);
      toast.success('User deleted successfully');
      setIsDeleteModalOpen(false);
      onClear();
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Failed to delete user';
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          {user ? (
            <>
              <h3 className="text-lg font-semibold text-gray-900">
                {user.firstName} {user.middleName ? `${user.middleName} ` : ''}{user.lastName}
                {(user.firstNameGuj || user.middleNameGuj || user.lastNameGuj) && (
                  <span className="ml-2 font-normal text-gray-500">
                    ({user.firstNameGuj || ''} {user.middleNameGuj ? `${user.middleNameGuj} ` : ''}{user.lastNameGuj || ''})
                  </span>
                )}
              </h3>
              <div className="mt-1 flex flex-col gap-1 text-sm text-gray-500 sm:flex-row sm:gap-4">
                <span>SMK No : {user.smkNo}</span>
                <span className="hidden sm:inline">•</span>
                <span>Mobile No : {user.mobileNo}</span>
              </div>
            </>
          ) : (
            <div>
              <h3 className="text-lg font-semibold text-gray-400">No user selected</h3>
              <div className="mt-1 text-sm text-gray-400">
                Search and select a user to mark attendance
              </div>
            </div>
          )}
        </div>

        {user && (
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Edit2 className="h-4 w-4" />
              <span className="hidden sm:inline">Edit</span>
            </button>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Delete</span>
            </button>
            <button
              onClick={onClear}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </div>
        )}
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
              disabled={!user}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 py-2 text-sm text-gray-900 focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
        </div>
        <div className="flex items-end">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !user}
            className="w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Present'}
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      <AddUserModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUserAdded={handleUserUpdated}
        editUser={user}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-3">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Delete User
              </h3>
            </div>
            <p className="mb-6 text-sm text-gray-600">
              Are you sure you want to delete{' '}
              <span className="font-semibold">
                {user?.firstName} {user?.lastName}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
