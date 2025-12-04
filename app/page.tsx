'use client';

import { useState } from 'react';
import { User } from '@/lib/types';
import SearchSection from '@/components/SearchSection';
import UserCard from '@/components/UserCard';
import AttendanceList from '@/components/AttendanceList';

export default function Home() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectionKey, setSelectionKey] = useState(0);

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setSelectionKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-8">
      <SearchSection onSelectUser={handleSelectUser} />

      {selectedUser && (
        <UserCard
          key={selectionKey}
          user={selectedUser}
          onClear={() => setSelectedUser(null)}
        />
      )}

        <AttendanceList />
    </div>
  );
}
