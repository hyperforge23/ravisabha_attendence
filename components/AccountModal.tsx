'use client';

import { useState, useEffect } from 'react';
import { X, UserPlus, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

interface Account {
  id: string;
  username: string;
  role: 'admin' | 'enterer';
}

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountSaved: () => void;
  editAccount?: Account | null;
}

export default function AccountModal({
  isOpen,
  onClose,
  onAccountSaved,
  editAccount = null,
}: AccountModalProps) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'enterer' as 'admin' | 'enterer',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const isEditMode = !!editAccount;

  useEffect(() => {
    if (editAccount) {
      setFormData({
        username: editAccount.username,
        password: '', // Leave blank on edit
        role: editAccount.role,
      });
    } else {
      setFormData({
        username: '',
        password: '',
        role: 'enterer',
      });
    }
    setError('');
  }, [editAccount, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.username.trim()) {
      setError('Username is required');
      return;
    }

    if (!isEditMode && !formData.password.trim()) {
      setError('Password is required');
      return;
    }

    setIsLoading(true);

    try {
      if (isEditMode) {
        await axios.put(`/api/accounts/${editAccount.id}`, formData);
        toast.success('Account updated successfully');
      } else {
        await axios.post('/api/accounts', formData);
        toast.success('Account created successfully');
      }
      onAccountSaved();
      onClose();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to save account';
      setError(message);
      if (err.response?.status === 403) {
        toast.error("You don't have permission to do that.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl my-8">
        {/* Header */}
        <div className="border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2 bg-blue-100 rounded-lg shrink-0">
              <UserPlus className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
              {isEditMode ? 'Edit Account' : 'Create Account'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
            disabled={isLoading}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password {isEditMode ? '(leave blank to keep current)' : <span className="text-red-500">*</span>}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required={!isEditMode}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={isEditMode ? 'Enter new password to change' : 'Enter password'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="role"
                  value="enterer"
                  checked={formData.role === 'enterer'}
                  onChange={handleChange}
                  className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Data Enterer</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Can add devotees and mark attendance. Cannot create or edit Ravisabha, edit or delete devotees, use pre-attendance toggle, or access Reports.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={formData.role === 'admin'}
                  onChange={handleChange}
                  className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Admin</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Full access, including Reports, Ravisabha management, and account management.
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? 'Saving...' : isEditMode ? 'Update Account' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
