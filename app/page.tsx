'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { User } from '@/lib/types';
import SearchSection from '@/components/SearchSection';
import UserCard from '@/components/UserCard';
import AttendanceList from '@/components/AttendanceList';

export default function Home() {
  const searchParams = useSearchParams();
  const ravisabhaId = searchParams.get('ravisabhaId');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectionKey, setSelectionKey] = useState(0);

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setSelectionKey((prev) => prev + 1);
  };

  const handleUserUpdated = (updatedUser: User) => {
    setSelectedUser(updatedUser);
    setSelectionKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-8">
      <SearchSection onSelectUser={handleSelectUser} />

      <UserCard
        key={selectionKey}
        user={selectedUser}
        ravisabhaId={ravisabhaId || undefined}
        onClear={() => setSelectedUser(null)}
        onUserUpdated={handleUserUpdated}
      />

      <AttendanceList ravisabhaId={ravisabhaId || undefined} />
    </div>
  );
}
