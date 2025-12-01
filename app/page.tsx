'use client';

import { useState } from 'react';
import { User } from '@/lib/types';
import SearchSection from '@/components/SearchSection';
import UserCard from '@/components/UserCard';
import AttendanceList from '@/components/AttendanceList';

export default function Home() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Mark Attendance</h1>
        <p className="text-gray-500">Search for a user and mark their attendance status.</p>
      </div>

      <SearchSection onSelectUser={setSelectedUser} />

      {selectedUser && (
        <UserCard
          user={selectedUser}
          onClear={() => setSelectedUser(null)}
        />
      )}

      <div className="pt-8">
        <AttendanceList />
      </div>
    </div>
  );
}
