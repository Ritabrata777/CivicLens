"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";

interface AuthModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AuthModal({ isOpen, onOpenChange }: AuthModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center text-2xl font-headline text-primary">Join the Community</DialogTitle>
                    <DialogDescription className="text-center">
                        You need to be logged in to perform this action. Sign in or create an account to contribute, vote, and earn rewards.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                    <Button asChild size="lg" className="w-full" onClick={() => onOpenChange(false)}>
                        <Link href="/login">
                            <LogIn className="mr-2 h-4 w-4" /> Log In
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="w-full" onClick={() => onOpenChange(false)}>
                        <Link href="/create-account">
                            <UserPlus className="mr-2 h-4 w-4" /> Create Account
                        </Link>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
