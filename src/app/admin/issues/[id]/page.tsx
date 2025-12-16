
import { getIssueById, getUserById, getIssuesByUserId } from '@/server/data';
import { notFound } from 'next/navigation';
import { AdminActions } from './AdminActions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/issues/StatusBadge';
import { MapPin, Calendar, Hash, CheckCircle, ExternalLink, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';
import { IssueTimeline } from '@/components/issues/IssueTimeline';
import MapComponent from '@/components/shared/Map';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { UserDetailsDialog } from '@/components/admin/UserDetailsDialog';
import { IssueImageLightbox } from '@/components/issues/IssueImageLightbox';

export default async function AdminIssueDetailPage({ params }: { params: { id: string } }) {
  const issue = await getIssueById(params.id);
  if (!issue) {
    notFound();
  }

  const user = await getUserById(issue.submittedBy);
  const userIssues = await getIssuesByUserId(issue.submittedBy);

  const stats = {
    totalIssues: userIssues.length,
    resolvedIssues: userIssues.filter(i => i.status === 'Resolved').length,
    totalPoints: userIssues.filter(i => i.status === 'Resolved').length * 50
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary">{issue.title}</CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{format(issue.submittedAt, 'PP p')}</span>
              </div>
              {user && (
                <UserDetailsDialog user={user} stats={stats}>
                  <div className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors hover:underline underline-offset-4">
                    <UserIcon className="w-4 h-4" />
                    <span>By {user.name}</span>
                  </div>
                </UserDetailsDialog>
              )}
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{issue.location.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4" />
                <span>ID: {issue.id}</span>
              </div>
              {issue.licensePlate && (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-yellow-600">Plate: {issue.licensePlate}</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <IssueImageLightbox
              imageUrl={issue.imageUrl}
              title={issue.title}
              imageHint={issue.imageHint}
              className="h-96 w-full mb-6 rounded-lg"
            />
            <p className="text-foreground/90 leading-relaxed">{issue.description}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Activity & Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <IssueTimeline updates={issue.updates} />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-lg">Admin Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground mb-4">Current Status: <StatusBadge status={issue.status} /></div>
            <AdminActions issueId={issue.id} currentStatus={issue.status} />
          </CardContent>
        </Card>

        {issue.blockchainTransaction && (
          <Card className="bg-accent/30 border-accent">
            <CardHeader>
              <CardTitle className="font-headline text-lg flex items-center gap-2 text-primary">
                <CheckCircle className="text-green-600" /> Blockchain Verified
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex flex-col gap-1">
                <span className="font-medium">Issue {issue.blockchainTransaction.status}</span>
                <a
                  href={issue.blockchainTransaction.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors break-all hover:underline"
                >
                  {issue.blockchainTransaction.txHash}
                  <ExternalLink className="w-3 h-3 inline ml-1" />
                </a>
              </div>
            </CardContent>
          </Card>
        )}

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
