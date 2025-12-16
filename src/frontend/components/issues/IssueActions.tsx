
"use client";

import { Button } from "@/frontend/components/ui/button";
import { useToast } from "@/frontend/hooks/use-toast";
import { upvoteIssueAction, remindAdminAction } from "@/backend/server/actions";
import { ThumbsUp, BellRing } from "lucide-react";
import { useState, useTransition } from "react";

type IssueActionsProps = {
  issueId: string;
  initialUpvotes: number;
};

export function IssueActions({ issueId, initialUpvotes }: IssueActionsProps) {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleUpvote = () => {
    startTransition(async () => {
      setUpvotes(prev => prev + 1);
      const result = await upvoteIssueAction(issueId);
      if (result.success) {
        toast({ title: "Supported!", description: "Your support has been recorded." });
      } else {
        setUpvotes(prev => prev - 1);
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    });
  };

  const handleRemind = () => {
    startTransition(async () => {
      const result = await remindAdminAction(issueId);
      if (result.success) {
        toast({ title: "Reminder Sent", description: result.message });
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-foreground">Community Support</p>
        <p className="text-2xl font-bold text-primary">{upvotes}</p>
      </div>
      <Button onClick={handleUpvote} disabled={isPending} className="w-full bg-accent hover:bg-accent/90">
        <ThumbsUp className="mr-2 h-4 w-4" /> Support this Issue
      </Button>
      <Button onClick={handleRemind} disabled={isPending} variant="outline" className="w-full">
        <BellRing className="mr-2 h-4 w-4" /> Remind Admin
      </Button>
    </div>
  );
}
