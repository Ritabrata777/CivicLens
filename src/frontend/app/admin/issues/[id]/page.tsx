
import { getIssueById } from '@/backend/server/data';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { StatusBadge } from '@/frontend/components/issues/StatusBadge';
import { MapPin, Calendar, Hash, CheckCircle, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { IssueTimeline } from '@/frontend/components/issues/IssueTimeline';
import MapComponent from '@/frontend/components/shared/Map';
import { Separator } from '@/frontend/components/ui/separator';
import { Button } from '@/frontend/components/ui/button';
import { AdminActions } from '../../components/AdminActions';

export default async function AdminIssueDetailPage({ params }: { params: { id: string } }) {
  const issue = await getIssueById(params.id);
  if (!issue) {
    notFound();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
             <CardTitle className="font-headline text-2xl text-primary">{issue.title}</CardTitle>
             <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{format(issue.submittedAt, 'PPP')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{issue.location.address}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    <span>ID: {issue.id}</span>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative h-96 w-full mb-6">
                <Image
                    src={issue.imageUrl}
                    alt={issue.title}
                    fill
                    className="object-cover rounded-lg"
                    data-ai-hint={issue.imageHint}
                />
            </div>
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
              <p className="text-muted-foreground">
                This issue's acceptance is recorded on-chain.
              </p>
              <Button asChild variant="link" className="p-0 h-auto">
                <a href={issue.blockchainTransaction.explorerUrl} target="_blank" rel="noopener noreferrer">
                  View Transaction <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </Button>
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
