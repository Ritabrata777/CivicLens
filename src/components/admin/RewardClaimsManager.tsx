"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { RewardClaim } from "@/lib/types";
import { approveRewardClaimAction, rejectRewardClaimAction } from "@/server/actions";

type RewardClaimsManagerProps = {
  claims: RewardClaim[];
};

function statusTone(status: RewardClaim["status"]) {
  if (status === "Paid") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300";
  }
  if (status === "Rejected") {
    return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300";
  }
  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300";
}

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function RewardClaimsManager({ claims }: RewardClaimsManagerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleApprove = (claimId: string) => {
    startTransition(async () => {
      const result = await approveRewardClaimAction(claimId);

      if (!result.success) {
        toast({
          title: "Payment failed",
          description: result.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Reward sent",
        description: result.message,
      });
      router.refresh();
    });
  };

  const handleReject = (claimId: string) => {
    startTransition(async () => {
      const result = await rejectRewardClaimAction(claimId);

      if (!result.success) {
        toast({
          title: "Rejection failed",
          description: result.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Claim rejected",
        description: result.message,
      });
      router.refresh();
    });
  };

  return (
    <div className="overflow-hidden rounded-[1.5rem] border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Wallet</TableHead>
            <TableHead>Reward</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Requested</TableHead>
            <TableHead>Transaction</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {claims.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                No reward claims yet.
              </TableCell>
            </TableRow>
          ) : (
            claims.map((claim) => (
              <TableRow key={claim.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">{claim.userName || claim.userId}</p>
                    <p className="text-xs text-muted-foreground">{claim.id}</p>
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  <span className="font-mono">{shortenAddress(claim.walletAddress)}</span>
                </TableCell>
                <TableCell>
                  <p className="font-medium">{claim.maticAmount.toFixed(2)} MATIC</p>
                  <p className="text-xs text-muted-foreground">{claim.pointsRedeemed} points</p>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusTone(claim.status)}>
                    {claim.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(claim.requestedAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  {claim.txHash ? (
                    <Link
                      href={`https://www.oklink.com/amoy/tx/${claim.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      View Tx
                    </Link>
                  ) : (
                    <span className="text-sm text-muted-foreground">Pending review</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {claim.status === "Pending" ? (
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(claim.id)}
                        disabled={isPending}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(claim.id)}
                        disabled={isPending}
                      >
                        Approve & Send
                      </Button>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {claim.reviewedByName ? `Reviewed by ${claim.reviewedByName}` : "Reviewed"}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
