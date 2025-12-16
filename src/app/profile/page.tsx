
import { getIssuesByUserId, getUserById } from '@/server/data';
import { IssueCard } from '@/components/issues/IssueCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ListChecks, CheckSquare, Hourglass, Award, Gift } from 'lucide-react';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// const MOCKED_USER_ID = 'user-1'; // Removed

const POINTS_PER_RESOLUTION = 50;
const POINTS_TO_MATIC_RATE = 150 / 10; // 150 points = 10 MATIC

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token');

  if (!sessionToken?.value) {
    redirect('/login');
  }

  const userId = sessionToken.value;

  const user = await getUserById(userId);
  const userIssues = await getIssuesByUserId(userId);

  const totalIssues = userIssues.length;
  const resolvedIssues = userIssues.filter(i => i.status === 'Resolved').length;
  const pendingIssues = totalIssues - resolvedIssues;

  const totalPoints = resolvedIssues * POINTS_PER_RESOLUTION;
  const maticValue = (totalPoints / POINTS_TO_MATIC_RATE).toFixed(2);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-6 bg-card p-6 rounded-lg">
        <Avatar className="h-24 w-24 border-4 border-primary">
          <AvatarImage src={user?.avatarUrl} alt={user?.name} data-ai-hint={user?.imageHint} />
          <AvatarFallback className="text-3xl">{user?.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">{user?.name}</h1>
          <p className="text-muted-foreground">Community Contributor</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Community Points</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalPoints}</div>
            <p className="text-xs text-muted-foreground">From {resolvedIssues} resolved issues</p>
          </CardContent>
        </Card>
        <Card className="bg-accent/30 border-accent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Redeemable Value</CardTitle>
            <Gift className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              <span className="font-mono">{maticValue}</span>
              <span className="text-lg ml-1">MATIC</span>
            </div>
            <p className="text-xs text-muted-foreground">150 points = 10 MATIC</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues Resolved</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{resolvedIssues}</div>
            <p className="text-xs text-muted-foreground">out of {totalIssues} submitted</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active/Pending Issues</CardTitle>
            <Hourglass className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingIssues}</div>
            <p className="text-xs text-muted-foreground">Awaiting resolution</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-2xl font-bold font-headline mb-4">Your Submitted Issues</h2>
        {userIssues.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userIssues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        ) : (
          <Card className="flex flex-col items-center justify-center p-12 text-center">
            <p className="text-lg font-medium">You haven't submitted any issues yet.</p>
            <p className="text-muted-foreground mt-2">When you do, they will appear here.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
