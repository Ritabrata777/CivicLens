import { Badge } from '@/components/ui/badge';
import type { IssueStatus } from '@/lib/types';

type StatusBadgeProps = {
  status: IssueStatus;
  className?: string;
};

const statusColors: Record<IssueStatus, string> = {
  Pending: 'bg-yellow-500/80 border-yellow-500/80 hover:bg-yellow-500/90',
  Seen: 'bg-blue-500/80 border-blue-500/80 hover:bg-blue-500/90',
  Accepted: 'bg-indigo-500/80 border-indigo-500/80 hover:bg-indigo-500/90',
  'In Progress': 'bg-purple-500/80 border-purple-500/80 hover:bg-purple-500/90',
  Resolved: 'bg-green-600/80 border-green-600/80 hover:bg-green-600/90',
  Rejected: 'bg-red-600/80 border-red-600/80 hover:bg-red-600/90',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge className={`text-white text-[10px] uppercase tracking-wider font-bold ${statusColors[status]} ${className}`}>
      {status}
    </Badge>
  );
}
