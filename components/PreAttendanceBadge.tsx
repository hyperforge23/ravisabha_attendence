import { cn } from '@/lib/utils';

export default function PreAttendanceBadge({
  status,
}: {
  status?: 'Present' | 'Absent' | null;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium md:text-xs',
        status === 'Present'
          ? 'bg-blue-100 text-blue-800'
          : status === 'Absent'
            ? 'bg-amber-100 text-amber-800'
            : 'bg-gray-100 text-gray-500'
      )}
    >
      Pre: {status || '—'}
    </span>
  );
}
