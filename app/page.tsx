'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { User } from '@/lib/types';
import SearchSection from '@/components/SearchSection';
import UserCard from '@/components/UserCard';
import AttendanceList from '@/components/AttendanceList';
import { isValidObjectId } from '@/lib/utils';

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ravisabhaId = searchParams.get('ravisabhaId');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectionKey, setSelectionKey] = useState(0);

  // Redirect to ravisabha list page if no ravisabhaId is provided or if it's not a valid ObjectId
  useEffect(() => {
    if (!ravisabhaId || !isValidObjectId(ravisabhaId)) {
      router.replace('/ravisabha');
    }
  }, [ravisabhaId, router]);

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setSelectionKey((prev) => prev + 1);
  };

  const handleUserUpdated = (updatedUser: User) => {
    setSelectedUser(updatedUser);
    setSelectionKey((prev) => prev + 1);
  };

  // Don't render anything if redirecting (no ravisabhaId or invalid format)
  if (!ravisabhaId || !isValidObjectId(ravisabhaId)) {
    return null;
  }

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
