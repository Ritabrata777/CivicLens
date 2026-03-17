
import Link from 'next/link';
import { getIssuesByUserId, getRewardClaimSummary, getRewardClaimsByUserId, getSOSAlertsBySender, getSOSAlertsForHero, getUserById } from '@/server/data';
import { IssueCard } from '@/components/issues/IssueCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProfilePhotoForm } from '@/components/profile/ProfilePhotoForm';
import { RewardClaimControls } from '@/components/profile/RewardClaimControls';
import { SOSDashboard } from '@/components/profile/SOSDashboard';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Hourglass, Award, Gift, Sparkles } from 'lucide-react';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SOS_HELP_REWARD_POINTS } from '@/lib/rewards';

function rewardStatusTone(status: "Pending" | "Paid" | "Rejected") {
  if (status === "Paid") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "Rejected") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-amber-200 bg-amber-50 text-amber-700";
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{ sos?: string }>;
}) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token');

  if (!sessionToken?.value) {
    redirect('/login');
  }

  const userId = sessionToken.value;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const [user, userIssues, helperAlerts, sentAlerts, rewardSummary, rewardClaims] = await Promise.all([
    getUserById(userId),
    getIssuesByUserId(userId),
    getSOSAlertsForHero(userId),
    getSOSAlertsBySender(userId),
    getRewardClaimSummary(userId),
    getRewardClaimsByUserId(userId),
  ]);

  const totalIssues = userIssues.length;
  const resolvedIssues = userIssues.filter(i => i.status === 'Resolved').length;
  const pendingIssues = totalIssues - resolvedIssues;
  const sosRewards = user?.rewardPoints || 0;
  const sosHelpsCount = Math.floor(sosRewards / SOS_HELP_REWARD_POINTS);
  const claimableMaticValue = rewardSummary.maticAmount.toFixed(2);
  const latestRewardClaims = rewardClaims.slice(0, 3);

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card to-primary/5 shadow-sm">
        <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg ring-4 ring-primary/15">
                <AvatarImage src={user?.avatarUrl} alt={user?.name} data-ai-hint={user?.imageHint} />
                <AvatarFallback className="text-3xl">{user?.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground shadow-sm">
                <Sparkles className="h-3 w-3" />
                Profile
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <h1 className="text-3xl font-bold font-headline text-primary">{user?.name}</h1>
                <p className="text-muted-foreground">{user?.role === 'admin' ? 'Administrator' : 'Community Contributor'}</p>
              </div>
              <p className="max-w-xl text-sm text-muted-foreground">
                Keep your profile photo updated so your reports and community activity feel more personal and trustworthy.
              </p>
            </div>
          </div>
          <div className="lg:self-start">
            <ProfilePhotoForm />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Community Points</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{rewardSummary.totalPoints}</div>
            <p className="text-xs text-muted-foreground">
              From {resolvedIssues} resolved issues and {sosHelpsCount} SOS help{sosHelpsCount === 1 ? '' : 's'}
            </p>
          </CardContent>
        </Card>
        <Card className="border-accent bg-accent/30 md:col-span-2 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Redeemable Value</CardTitle>
            <Gift className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-2xl font-bold text-primary">
              <span className="font-mono">{claimableMaticValue}</span>
              <span className="text-lg ml-1">MATIC</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {rewardSummary.claimUnits > 0
                ? `${rewardSummary.claimablePoints} points are ready to redeem right now.`
                : `150 points = 10 MATIC. ${rewardSummary.pointsUntilNextClaim} more point${rewardSummary.pointsUntilNextClaim === 1 ? '' : 's'} to unlock the next claim.`}
            </p>

            <RewardClaimControls
              walletAddress={user?.walletAddress}
              claimUnits={rewardSummary.claimUnits}
              claimablePoints={rewardSummary.claimablePoints}
              claimableMaticAmount={rewardSummary.maticAmount}
              pointsUntilNextClaim={rewardSummary.pointsUntilNextClaim}
              hasPendingClaim={rewardSummary.hasPendingClaim}
              isAdmin={user?.role === 'admin'}
            />

            {latestRewardClaims.length > 0 ? (
              <div className="space-y-2 rounded-2xl border border-border/70 bg-background/70 p-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Recent Claims</p>
                <div className="space-y-2">
                  {latestRewardClaims.map((claim) => (
                    <div key={claim.id} className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card/80 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {claim.maticAmount.toFixed(2)} MATIC
                          <span className="ml-2 text-xs text-muted-foreground">{claim.pointsRedeemed} points</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Requested {new Date(claim.requestedAt).toLocaleDateString()}
                        </p>
                        {claim.note ? (
                          <p className="mt-1 text-xs text-muted-foreground">{claim.note}</p>
                        ) : null}
                        {claim.txHash ? (
                          <Link
                            href={`https://www.oklink.com/amoy/tx/${claim.txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-block text-xs font-medium text-primary hover:underline"
                          >
                            View payout transaction
                          </Link>
                        ) : null}
                      </div>
                      <Badge variant="outline" className={rewardStatusTone(claim.status)}>
                        {claim.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
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

      <SOSDashboard
        helperAlerts={helperAlerts}
        sentAlerts={sentAlerts}
        currentUserId={userId}
        defaultTab={resolvedSearchParams?.sos}
      />

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
