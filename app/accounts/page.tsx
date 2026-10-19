'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { UserPlus, Edit2, Trash2, Shield, User } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import AccountModal from '@/components/AccountModal';

interface Account {
  id: string;
  username: string;
  role: 'admin' | 'enterer';
  createdAt: string;
}

export default function AccountsPage() {
  const { isAdmin, isAuthenticated } = useAuth();
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [deleteAccount, setDeleteAccount] = useState<Account | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!isAdmin) {
      router.push('/ravisabha');
      return;
    }
    fetchAccounts();
  }, [isAuthenticated, isAdmin, router]);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.get('/api/accounts');
      setAccounts(data.users || []);
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error('Access denied');
        router.push('/ravisabha');
      } else {
        toast.error('Failed to load accounts');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (account: Account) => {
    setEditAccount(account);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteAccount) return;

    setIsDeleting(true);
    try {
      await axios.delete(`/api/accounts/${deleteAccount.id}`);
      toast.success('Account deleted successfully');
      setDeleteAccount(null);
      fetchAccounts();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete account';
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditAccount(null);
  };

  const handleAccountSaved = () => {
    fetchAccounts();
  };

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Login Accounts
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage user accounts and permissions
          </p>
        </div>
        <button
          onClick={() => {
            setEditAccount(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add Account</span>
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="text-center text-gray-500">Loading accounts...</div>
        </div>
      ) : accounts.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="text-center text-gray-500">No accounts found</div>
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Left side - User info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`rounded-full p-2 shrink-0 ${
                      account.role === 'admin'
                        ? 'bg-purple-100'
                        : 'bg-blue-100'
                    }`}
                  >
                    {account.role === 'admin' ? (
                      <Shield className="h-5 w-5 text-purple-600" />
                    ) : (
                      <User className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {account.username}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span
                        className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                          account.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {account.role === 'admin' ? 'Admin' : 'Data Enterer'}
                      </span>
                      <span className="text-xs text-gray-500">
                        Created: {new Date(account.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side - Actions */}
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleEdit(account)}
                    className="flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <Edit2 className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => setDeleteAccount(account)}
                    className="flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Account Modal */}
      <AccountModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAccountSaved={handleAccountSaved}
        editAccount={editAccount}
      />

      {/* Delete Confirmation Modal */}
      {deleteAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-3">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Delete Account
              </h3>
            </div>
            <p className="mb-6 text-sm text-gray-600">
              Are you sure you want to delete the account{' '}
              <span className="font-semibold">{deleteAccount.username}</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteAccount(null)}
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
