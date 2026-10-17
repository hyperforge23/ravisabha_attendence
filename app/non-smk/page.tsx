'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import AddUserModal from '@/components/AddUserModal';
import { User } from '@/lib/types';

export default function NonSmkPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleUserAdded = (_user: User) => {
    // Toasts and modal flow are handled inside AddUserModal
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Non-SMK
        </h1>
        <p className="text-sm text-gray-600 sm:text-base">
          Create a Kutumb main person from an eligible Non-SMK candidate, then
          add family members to the same household. This is independent of
          ravisabha attendance.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Household setup</h2>
        <p className="mt-1 text-sm text-gray-600">
          Main person must have at least 3 distinct present ravisabhas before
          Kutumb creation.
        </p>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <UserPlus className="h-4 w-4" />
          Add User
        </button>
      </div>

      <AddUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUserAdded={handleUserAdded}
      />
    </div>
  );
}
