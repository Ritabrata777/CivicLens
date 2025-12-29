import { getIssues } from '@/server/data';
import { IssueCard } from '@/components/issues/IssueCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

export default async function IssuesPage() {
  const issues = await getIssues();

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary font-headline">
            Public Square
          </h1>
          <p className="text-muted-foreground mt-1">
            Browse and support issues reported by your community.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/report">
            <PlusCircle className="mr-2 h-5 w-5" />
            Report a New Issue
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {issues.map((issue) => (
          <IssueCard key={issue.id} issue={issue} />
        ))}
      </div>
    </div>
  );
}
