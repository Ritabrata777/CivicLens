"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Gift, Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { connectWallet } from "@/lib/web3";
import { requestRewardClaimAction, saveRewardWalletAction } from "@/server/actions";

type RewardClaimControlsProps = {
  walletAddress?: string;
  claimUnits: number;
  claimablePoints: number;
  claimableMaticAmount: number;
  pointsUntilNextClaim: number;
  hasPendingClaim: boolean;
  isAdmin?: boolean;
};

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function RewardClaimControls({
  walletAddress,
  claimUnits,
  claimablePoints,
  claimableMaticAmount,
  pointsUntilNextClaim,
  hasPendingClaim,
  isAdmin,
}: RewardClaimControlsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isSavingWallet, setIsSavingWallet] = useState(false);

  const handleConnectWallet = async () => {
    setIsSavingWallet(true);

    try {
      const address = await connectWallet();
      if (!address) {
        toast({
          title: "Wallet not connected",
          description: "Please connect MetaMask to receive payouts.",
          variant: "destructive",
        });
        return;
      }

      const result = await saveRewardWalletAction(address);
      if (!result.success) {
        toast({
          title: "Wallet save failed",
          description: result.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Payout wallet saved",
        description: result.walletAddress || result.message,
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Wallet save failed",
        description: error instanceof Error ? error.message : "Failed to save payout wallet.",
        variant: "destructive",
      });
    } finally {
      setIsSavingWallet(false);
    }
  };

  const handleClaim = () => {
    startTransition(async () => {
      const result = await requestRewardClaimAction();

      if (!result.success) {
        toast({
          title: "Claim not submitted",
          description: result.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Claim submitted",
        description: result.message,
      });
      router.refresh();
    });
  };

  if (isAdmin) {
    return (
      <p className="text-xs text-muted-foreground">
        Reward claiming is available for community users only.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border/70 bg-background/70 p-3">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Payout Wallet</p>
        <p className="mt-1 text-sm font-medium text-foreground">
          {walletAddress ? shortenAddress(walletAddress) : "No wallet saved yet"}
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="sm:flex-1"
          onClick={handleConnectWallet}
          disabled={isSavingWallet || isPending}
        >
          {isSavingWallet ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wallet className="mr-2 h-4 w-4" />}
          {walletAddress ? "Update Wallet" : "Save Wallet"}
        </Button>

        <Button
          type="button"
          className="sm:flex-[1.2]"
          onClick={handleClaim}
          disabled={!walletAddress || hasPendingClaim || claimUnits < 1 || isPending || isSavingWallet}
        >
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Gift className="mr-2 h-4 w-4" />}
          {hasPendingClaim
            ? "Claim Pending"
            : claimUnits > 0
              ? `Claim ${claimableMaticAmount.toFixed(2)} MATIC`
              : "Not Ready Yet"}
        </Button>
      </div>

      {hasPendingClaim ? (
        <p className="text-xs text-amber-700">
          Your last reward request is already waiting for admin approval.
        </p>
      ) : claimUnits > 0 ? (
        <p className="text-xs text-emerald-700">
          {claimablePoints} points are ready. This claim will request {claimableMaticAmount.toFixed(2)} MATIC.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Earn {pointsUntilNextClaim} more point{pointsUntilNextClaim === 1 ? "" : "s"} to unlock your next reward claim.
        </p>
      )}
    </div>
  );
}
