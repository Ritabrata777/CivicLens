import type { IssueUpdate } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle, Circle, Dot } from 'lucide-react';

export function IssueTimeline({ updates }: { updates: IssueUpdate[] }) {
  return (
    <div className="space-y-6">
      {updates.map((update, index) => (
        <div key={index} className="flex gap-4">
          <div>
            {index === updates.length - 1 ? (
              <CheckCircle className="w-5 h-5 text-primary" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground/50" />
            )}
            {index < updates.length - 1 && (
              <div className="h-full w-px bg-border ml-2.5 mt-1" />
            )}
          </div>
          <div className="flex-1 pb-6 -mt-1">
            <div className="flex justify-between items-center">
              <p className="font-semibold text-foreground">
                Status changed to <span className="text-primary">{update.status}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(update.timestamp, { addSuffix: true })}
              </p>
            </div>
            <p className="text-sm text-muted-foreground mt-1">by {update.updatedBy}</p>
            {update.notes && (
              <p className="text-sm bg-secondary p-2 rounded-md mt-2">
                {update.notes}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
