
import { getIssueById, getUserById } from '@/backend/server/data';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/frontend/components/ui/avatar';
import { StatusBadge } from '@/frontend/components/issues/StatusBadge';
import { MapPin, Calendar, Hash, CheckCircle, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { IssueTimeline } from '@/frontend/components/issues/IssueTimeline';
import { IssueActions } from '@/frontend/components/issues/IssueActions';
import MapComponent from '@/frontend/components/shared/Map';
import { Separator } from '@/frontend/components/ui/separator';
import { Button } from '@/frontend/components/ui/button';

export default async function IssueDetailPage({ params }: { params: { id: string } }) {
  const issue = await getIssueById(params.id);
  if (!issue) {
    notFound();
  }

  const user = await getUserById(issue.submittedBy);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader className="p-0">
            <div className="relative h-96 w-full">
              <Image
                src={issue.imageUrl}
                alt={issue.title}
                fill
                className="object-cover rounded-t-lg"
                data-ai-hint={issue.imageHint}
              />
              <div className="absolute top-4 right-4">
                <StatusBadge status={issue.status} className="text-sm px-3 py-1" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <h1 className="text-3xl font-bold font-headline text-primary mb-2">{issue.title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
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
            <CardTitle className="font-headline text-lg">Community Support</CardTitle>
          </CardHeader>
          <CardContent>
            <IssueActions issueId={issue.id} initialUpvotes={issue.upvotes} />
          </CardContent>
        </Card>

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

        {issue.blockchainTransaction && (
          <Card className="bg-accent/30 border-accent">
            <CardHeader>
              <CardTitle className="font-headline text-lg flex items-center gap-2 text-primary">
                <CheckCircle className="text-green-600" /> Blockchain Verified
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p className="text-muted-foreground">
                This issue's acceptance has been recorded on the blockchain for transparency.
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
