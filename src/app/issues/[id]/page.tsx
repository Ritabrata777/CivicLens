
import { getIssueById, getUserById } from '@/server/data';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/issues/StatusBadge';
import { MapPin, Calendar, Hash, CheckCircle, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { IssueTimeline } from '@/components/issues/IssueTimeline';
import { IssueActions } from '@/components/issues/IssueActions';
import MapComponent from '@/components/shared/Map';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { BlockchainVerificationCard } from '@/components/issues/BlockchainVerificationCard';
import { IssueImageLightbox } from '@/components/issues/IssueImageLightbox';

import { isUserLoggedIn } from '@/lib/auth-server';

// ... existing imports

export default async function IssueDetailPage({ params }: { params: { id: string } }) {
  const issue = await getIssueById(params.id);
  if (!issue) {
    notFound();
  }

  const user = await getUserById(issue.submittedBy);
  const isLoggedIn = await isUserLoggedIn();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* ... existing Issue Detail Card ... */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <div className="relative h-64 w-full bg-muted">
            {issue.imageUrl ? (
              <IssueImageLightbox
                imageUrl={issue.imageUrl}
                title={issue.title}
                imageHint={issue.imageHint}
                className="h-full w-full rounded-t-lg"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <span className="flex items-center gap-2"><MapPin className="h-5 w-5" /> No Image Provided</span>
              </div>
            )}
          </div>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Hash className="h-4 w-4" />
                  <span>Issue #{issue.id}</span>
                  <span>•</span>
                  <Calendar className="h-4 w-4" />
                  <span>{format(issue.submittedAt, "PPP")}</span>
                </div>
                <CardTitle className="text-2xl font-headline">{issue.title}</CardTitle>
              </div>
              <StatusBadge status={issue.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose dark:prose-invert max-w-none">
              <p>{issue.description}</p>
            </div>
            {issue.category === 'Other' && ( // Or just show category
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="text-muted-foreground">Category:</span>
                <span>{issue.category}</span>
              </div>
            )}

            {issue.licensePlate && (
              <div className="flex items-center gap-2 text-sm font-medium mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                <span className="text-yellow-600 dark:text-yellow-500 font-bold">Vehicle No:</span>
                <span className="font-mono text-foreground">{issue.licensePlate}</span>
                {issue.violationType && (
                  <span className="text-muted-foreground ml-2 text-xs">({issue.violationType})</span>
                )}
              </div>
            )}

            <Separator />

            <h3 className="font-semibold text-lg pt-2">History & Updates</h3>
            <IssueTimeline updates={issue.updates} />

          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>

          <CardContent>
            <IssueActions issueId={issue.id} initialUpvotes={issue.upvotes} isLoggedIn={isLoggedIn} />
          </CardContent>
        </Card>
        {/* ... existing content ... */}


        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-lg">Submitted By</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={user?.avatarUrl} alt={user?.name} data-ai-hint={user?.imageHint} />
              <AvatarFallback>{user?.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{user?.name}</p>
              <p className="text-sm text-muted-foreground">Community Member</p>
            </div>
          </CardContent>
        </Card>

        {/* Real Blockchain Verification Component */}
        <BlockchainVerificationCard transaction={issue.blockchainTransaction} />


        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-lg">Location</CardTitle>
          </CardHeader>
          <CardContent className="h-64 rounded-lg overflow-hidden">
            <MapComponent lat={issue.location.lat} lng={issue.location.lng} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
