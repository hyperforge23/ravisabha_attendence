'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Calendar, FileText, ArrowRight, Edit2, User, Utensils, StickyNote } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import AddRavisabhaModal from '@/components/AddRavisabhaModal';
import { formatIndianCurrency } from '@/lib/utils';

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

export default function RavisabhaListPage() {
  const [ravisabhas, setRavisabhas] = useState<Ravisabha[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRavisabha, setEditingRavisabha] = useState<Ravisabha | null>(null);
  const router = useRouter();

  const fetchRavisabhas = async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      const { data } = await axios.get('/api/ravisabha', {
        params: { month },
      });
      
      setRavisabhas(data.ravisabhas || []);
    } catch (error) {
      console.error('Error fetching ravisabhas:', error);
      toast.error('Failed to load ravisabhas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRavisabhas();
  }, []);

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

  const handleRavisabhaClick = (ravisabhaId: string) => {
    router.push(`/?ravisabhaId=${ravisabhaId}`);
  };

  const getCurrentMonthName = () => {
    return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Ravisabha - {getCurrentMonthName()}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and view this month's ravisabha sessions
          </p>
        </div>
        <button
          onClick={() => {
            setEditingRavisabha(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add New Ravisabha
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading ravisabhas...</div>
        </div>
      ) : ravisabhas.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 shadow-sm">
          <div className="text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No ravisabhas this month</h3>
            <p className="mt-2 text-sm text-gray-500">
              Get started by adding your first ravisabha session.
            </p>
            <button
              onClick={() => {
                setEditingRavisabha(null);
                setIsModalOpen(true);
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              <Plus className="h-4 w-4" />
              Add Ravisabha
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ravisabhas.map((ravisabha) => (
            <div
              key={ravisabha._id}
              className="group relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-gray-300"
            >
              <div
                onClick={() => handleRavisabhaClick(ravisabha._id)}
                className="cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4 pr-10">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatDateShort(ravisabha.date)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(ravisabha.date)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingRavisabha(ravisabha);
                        setIsModalOpen(true);
                      }}
                      className="px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
                  </div>
                </div>
              </div>

              <div
                onClick={() => handleRavisabhaClick(ravisabha._id)}
                className="cursor-pointer space-y-2"
              >
                <div className="mb-3 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span>Attendance:</span>
                    <span className="text-gray-900">{ravisabha.attendanceCount || 0}</span>
                  </div>
                </div>
                {ravisabha.yajman && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="truncate font-medium">{ravisabha.yajman}</span>
                  </div>
                )}
                {ravisabha.prasad && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Utensils className="h-4 w-4 text-gray-400" />
                    <span className="truncate">{ravisabha.prasad}</span>
                  </div>
                )}
                {ravisabha.expense && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="h-4 w-4 text-gray-400">₹</span>
                    <span className="font-medium">₹{formatIndianCurrency(ravisabha.expense)}</span>
                  </div>
                )}
                {ravisabha.notes && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <StickyNote className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{ravisabha.notes}</span>
                  </div>
                )}
                {!ravisabha.yajman && !ravisabha.prasad && !ravisabha.expense && !ravisabha.notes && (
                  <div className="text-sm text-gray-400 italic">No additional details</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AddRavisabhaModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRavisabha(null);
        }}
        onSuccess={fetchRavisabhas}
        ravisabha={editingRavisabha}
      />
    </div>
  );
}

