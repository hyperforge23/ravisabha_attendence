'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { User } from '@/lib/types';
import SearchSection from '@/components/SearchSection';
import UserCard from '@/components/UserCard';
import AttendanceList from '@/components/AttendanceList';
import { isValidObjectId } from '@/lib/utils';
import { Calendar } from 'lucide-react';

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ravisabhaId = searchParams.get('ravisabhaId');
  const dateParam = searchParams.get('date');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectionKey, setSelectionKey] = useState(0);

  // Redirect to ravisabha list page if no ravisabhaId is provided or if it's not a valid ObjectId
  useEffect(() => {
    if (!ravisabhaId || !isValidObjectId(ravisabhaId)) {
      router.replace('/ravisabha');
    }
  }, [ravisabhaId, router]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

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

  // Get ravisabha date from query params if available
  const ravisabhaDate = dateParam ? decodeURIComponent(dateParam) : null;

  return (
    <div className="space-y-8">
      {/* Ravisabha Date Display */}
      {ravisabhaDate && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-gray-500" />
            <div>
              <div className="text-sm font-medium text-gray-500">Ravisabha Date</div>
              <div className="text-lg font-semibold text-gray-900">
                {formatDate(ravisabhaDate)}
              </div>
            </div>
          </div>
        </div>
      )}

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
