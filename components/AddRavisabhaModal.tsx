'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, FileText } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { formatIndianCurrency, parseIndianCurrency } from '@/lib/utils';
import { User } from '@/lib/types';

interface Ravisabha {
  _id: string;
  date: string;
  prasad?: string;
  expense?: number;
  yajman?: string;
  notes?: string;
}

interface AddRavisabhaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ravisabha?: Ravisabha | null; // If provided, modal is in edit mode
}

export default function AddRavisabhaModal({ isOpen, onClose, onSuccess, ravisabha }: AddRavisabhaModalProps) {
  const [date, setDate] = useState('');
  const [prasad, setPrasad] = useState('');
  const [expense, setExpense] = useState('');
  const [yajman, setYajman] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search State
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const searchUsers = async () => {
      if (!yajman || yajman.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const { data } = await axios.get('/api/search', {
          params: {
            query: yajman,
            field: 'anyName',
          },
        });
        setSearchResults(data.users);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [yajman]);

  const isEditMode = !!ravisabha;

  useEffect(() => {
    if (isOpen) {
      if (ravisabha) {
        // Edit mode: populate with existing data
        const dateObj = new Date(ravisabha.date);
        setDate(dateObj.toISOString().split('T')[0]);
        setPrasad(ravisabha.prasad || '');
        setExpense(ravisabha.expense ? formatIndianCurrency(ravisabha.expense) : '');
        setYajman(ravisabha.yajman || '');
        setNotes(ravisabha.notes || '');
      } else {
        // Add mode: Set today's date when modal opens
        const today = new Date().toISOString().split('T')[0];
        setDate(today);
        setPrasad('');
        setExpense('');
        setYajman('');
        setNotes('');
      }
    }
  }, [isOpen, ravisabha]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date) {
      toast.error('Date is required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode && ravisabha) {
        // Update existing ravisabha
        const updatePayload: any = {
          date,
          prasad: prasad || null,
          expense: expense ? parseFloat(parseIndianCurrency(expense)) : null,
          yajman: yajman || null,
          notes: notes || null,
        };
        
        await axios.put(`/api/ravisabha/${ravisabha._id}`, updatePayload);
        toast.success('Ravisabha updated successfully');
      } else {
        // Create new ravisabha
        await axios.post('/api/ravisabha', {
          date,
          prasad: prasad || undefined,
          expense: expense ? parseFloat(parseIndianCurrency(expense)) : undefined,
          yajman: yajman || undefined,
          notes: notes || undefined,
        });
        toast.success('Ravisabha added successfully');
      }
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(`Error ${isEditMode ? 'updating' : 'adding'} ravisabha:`, error);
      const errorMessage = error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'add'} ravisabha`;
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditMode ? 'Edit Ravisabha' : 'Add New Ravisabha'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Date *</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 py-2.5 text-sm text-gray-900 focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          </div>

          <div className="relative">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Prasad</label>
            <div className="relative">
              <FileText className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={prasad}
                onChange={(e) => setPrasad(e.target.value)}
                placeholder="Enter prasad details"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 py-2.5 text-sm text-gray-900 focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          </div>

          <div className="relative">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Expense (₹)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400 text-sm font-medium">₹</span>
              <input
                type="text"
                value={expense}
                onChange={(e) => {
                  // Remove all non-digit and non-decimal characters except comma
                  let input = e.target.value.replace(/[^\d.,]/g, '');
                  
                  // Handle decimal point - only allow one
                  const parts = input.split('.');
                  if (parts.length > 2) {
                    input = parts[0] + '.' + parts.slice(1).join('');
                  }
                  
                  // Remove commas for parsing, then format
                  const numericValue = parseIndianCurrency(input);
                  if (numericValue === '' || numericValue === '.') {
                    setExpense(numericValue);
                  } else {
                    // Format with Indian style commas
                    const formatted = formatIndianCurrency(numericValue);
                    setExpense(formatted);
                  }
                }}
                placeholder="0"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 py-2.5 text-sm text-gray-900 focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          </div>

          <div className="relative z-20">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Yajman</label>
            <div className="relative">
              <FileText className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={yajman}
                onChange={(e) => {
                  setYajman(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Enter Yajman name"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 py-2.5 text-sm text-gray-900 focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                autoComplete="off"
              />
              
              {showDropdown && yajman && (searchResults.length > 0 || isSearching) && (
                <div className="absolute top-full mt-1 w-full overflow-hidden rounded-lg border border-gray-100 bg-white shadow-lg">
                  {isSearching ? (
                    <div className="px-4 py-2 text-xs text-gray-500">Searching...</div>
                  ) : (
                    <ul className="max-h-48 overflow-y-auto py-1">
                      {searchResults.map((user) => (
                        <li
                          key={user.id}
                          onClick={() => {
                            setYajman(`${user.firstName} ${user.lastName}`);
                            setShowDropdown(false);
                          }}
                          className="cursor-pointer px-3 py-2 text-sm hover:bg-gray-50"
                        >
                          <span className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </span>
                          <span className="ml-2 text-xs text-gray-500">
                            ({user.smkNo})
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={3}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting 
                ? (isEditMode ? 'Updating...' : 'Adding...') 
                : (isEditMode ? 'Update Ravisabha' : 'Add Ravisabha')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

