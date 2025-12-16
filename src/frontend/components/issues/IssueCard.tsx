import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { Badge } from '@/frontend/components/ui/badge';
import type { Issue } from '@/lib/types';
import { ThumbsUp, MapPin, Tag, AlertTriangle } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { formatDistanceToNow } from 'date-fns';

type IssueCardProps = {
  issue: Issue;
};

export function IssueCard({ issue }: IssueCardProps) {
  return (
    <Link href={`/issues/${issue.id}`} className="block group">
      <Card className="h-full flex flex-col transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">
        <CardHeader className="p-0">
          <div className="relative h-48 w-full">
            <Image
              src={issue.imageUrl}
              alt={issue.title}
              fill
              className="object-cover rounded-t-lg"
              data-ai-hint={issue.imageHint}
            />
             {issue.isUrgent && (
              <div className="absolute top-2 left-2 bg-destructive/80 text-destructive-foreground p-1 rounded-full z-10">
                <AlertTriangle className="h-4 w-4" />
              </div>
            )}
            <div className="absolute top-2 right-2">
              <StatusBadge status={issue.status} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow pt-4">
          <CardTitle className="text-lg font-semibold leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {issue.title}
          </CardTitle>
          
          <div className="flex items-center text-xs text-muted-foreground gap-2 mt-2">
            <Tag className="w-3 h-3"/> 
            <span>{issue.category}</span>
          </div>

          <div className="flex items-center text-xs text-muted-foreground gap-2 mt-1">
             <MapPin className="w-3 h-3"/>
             <span>{issue.location.address}</span>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <ThumbsUp className="w-4 h-4 text-primary/70" />
            <span>{issue.upvotes} Supports</span>
          </div>
          <p className="text-xs">
            {formatDistanceToNow(issue.submittedAt, { addSuffix: true })}
          </p>
        </CardFooter>
      </Card>
    </Link>
  );
}
