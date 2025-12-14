'use client';

import { useState, useEffect } from 'react';
import { X, UserPlus, Loader2 } from 'lucide-react';
import axios from 'axios';
import { User } from '@/lib/types';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: (user: User) => void;
  initialFirstName?: string;
  editUser?: User | null;
}

export default function AddUserModal({
  isOpen,
  onClose,
  onUserAdded,
  initialFirstName = '',
  editUser = null,
}: AddUserModalProps) {
  const [formData, setFormData] = useState({
    firstName: editUser?.firstName || initialFirstName,
    middleName: '',
    lastName: editUser?.lastName || '',
    smkNo: editUser?.smkNo || '',
    mobileNo: editUser?.mobileNo || '',
    gender: editUser?.gender || '1',
    age: '',
    presentVillageEng: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const isEditMode = !!editUser;

  // Populate form when editing
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (editUser) {
        try {
          const { data } = await axios.get(`/api/users/${editUser.id}`);
          const user = data.user;
          setFormData({
            firstName: user.firstName || '',
            middleName: user.middleName || '',
            lastName: user.lastName || '',
            smkNo: user.smkNo || '',
            mobileNo: user.mobileNo || '',
            gender: user.gender || '1',
            age: user.age?.toString() || '',
            presentVillageEng: user.presentVillageEng || '',
          });
        } catch (error) {
          console.error('Error fetching user details:', error);
          // Fallback to editUser data
          setFormData({
            firstName: editUser.firstName || '',
            middleName: '',
            lastName: editUser.lastName || '',
            smkNo: editUser.smkNo || '',
            mobileNo: editUser.mobileNo || '',
            gender: editUser.gender || '1',
            age: '',
            presentVillageEng: '',
          });
        }
      } else if (initialFirstName) {
        setFormData({
          firstName: initialFirstName,
          middleName: '',
          lastName: '',
          smkNo: '',
          mobileNo: '',
          gender: '1',
          age: '',
          presentVillageEng: '',
        });
      }
    };

    fetchUserDetails();
  }, [editUser, initialFirstName]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.firstName || !formData.lastName) {
      setError('First name and last name are required');
      return;
    }

    setIsLoading(true);

    try {
      let data;
      if (isEditMode) {
        const response = await axios.put(`/api/users/${editUser.id}`, formData);
        data = response.data;
      } else {
        const response = await axios.post('/api/users', formData);
        data = response.data;
      }
      onUserAdded(data.user);
      onClose();
      // Reset form
      setFormData({
        firstName: '',
        middleName: '',
        lastName: '',
        smkNo: '',
        mobileNo: '',
        gender: '1',
        age: '',
        presentVillageEng: '',
      });
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to add user. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserPlus className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditMode ? 'Edit User' : 'Add New User'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter first name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Middle Name
                </label>
                <input
                  type="text"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter middle name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter last name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="1">Male</option>
                  <option value="2">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  min="0"
                  max="150"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter age"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile No
                </label>
                <input
                  type="tel"
                  name="mobileNo"
                  value={formData.mobileNo}
                  onChange={handleChange}
                  maxLength={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter 10-digit mobile number"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Present Village
                </label>
                <input
                  type="text"
                  name="presentVillageEng"
                  value={formData.presentVillageEng}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter present village"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SMK No <span className="text-gray-500 text-xs">(Optional - Auto-generated if empty)</span>
                </label>
                <input
                  type="text"
                  name="smkNo"
                  value={formData.smkNo}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Non_PJP_15112025 (leave empty for auto-generation)"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Format: Non_[FirstInitial][MiddleInitial][LastInitial]_[DDMMYYYY]
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isEditMode ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  {isEditMode ? 'Update User' : 'Add User'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
