import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CircleDollarSign, Gift, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RewardClaimsManager } from "@/components/admin/RewardClaimsManager";
import { getRewardClaimsForAdmin, getUserById } from "@/server/data";

const DEFAULT_TREASURY_WALLET = "0x07e28def8DC590A442790c80Fd6A3A5240Df0184";

export default async function AdminRewardsPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token");

  if (!sessionToken?.value) {
    redirect("/admin/login");
  }

  const adminUser = await getUserById(sessionToken.value);
  if (!adminUser || adminUser.role !== "admin") {
    redirect("/admin/login");
  }

  const claims = await getRewardClaimsForAdmin();
  const pendingClaims = claims.filter((claim) => claim.status === "Pending");
  const paidClaims = claims.filter((claim) => claim.status === "Paid");
  const rejectedClaims = claims.filter((claim) => claim.status === "Rejected");
  const totalPaidMatic = paidClaims.reduce((sum, claim) => sum + claim.maticAmount, 0);
  const treasuryWallet = process.env.REWARD_PAYOUT_WALLET?.trim() || DEFAULT_TREASURY_WALLET;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-emerald-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.15),_transparent_30%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(236,253,245,0.95)_48%,_rgba(239,246,255,0.96))] p-8 shadow-sm dark:border-emerald-500/25 dark:bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_30%),linear-gradient(135deg,_rgba(10,18,26,0.98),_rgba(12,32,26,0.96)_48%,_rgba(14,24,40,0.98))]">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-300/20 blur-3xl dark:bg-emerald-400/15" />
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-sm font-medium text-emerald-700 backdrop-blur dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-300">
              <Gift className="h-4 w-4" />
              Rewards Console
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">Approve community payouts</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Review reward claims from residents, approve them once verified, and send MATIC directly from the configured treasury wallet to the user payout address.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/80 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/55">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Treasury Wallet</p>
            <p className="mt-3 break-all font-mono text-sm text-slate-900 dark:text-slate-100">{treasuryWallet}</p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Approved claims send funds directly from this wallet to the citizen wallet on file.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-amber-200/70 bg-amber-50/70 shadow-sm dark:border-amber-500/25 dark:bg-amber-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-300">
              <Gift className="h-4 w-4" />
              Pending Claims
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-700 dark:text-amber-200">{pendingClaims.length}</div>
            <p className="mt-1 text-xs text-amber-700/75 dark:text-amber-200/75">Ready for admin review.</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200/70 bg-emerald-50/70 shadow-sm dark:border-emerald-500/25 dark:bg-emerald-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
              <CircleDollarSign className="h-4 w-4" />
              Total Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-200">{totalPaidMatic.toFixed(2)} MATIC</div>
            <p className="mt-1 text-xs text-emerald-700/75 dark:text-emerald-200/75">{paidClaims.length} claims completed.</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 bg-slate-50/80 shadow-sm dark:border-slate-500/25 dark:bg-slate-800/40">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <Wallet className="h-4 w-4" />
              Reviewed Claims
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-700 dark:text-slate-100">{paidClaims.length + rejectedClaims.length}</div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{rejectedClaims.length} rejected so far.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[1.75rem] border border-border/70 shadow-sm dark:border-white/10 dark:bg-slate-950/45">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl text-slate-950 dark:text-slate-50">
            <Wallet className="h-5 w-5 text-primary" />
            Reward Claims
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RewardClaimsManager claims={claims} />
        </CardContent>
      </Card>
    </div>
  );
}
