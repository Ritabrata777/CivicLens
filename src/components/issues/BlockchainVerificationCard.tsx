"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ExternalLink, Loader2 } from "lucide-react";
import { getIssueDetails, CONTRACT_ADDRESS } from "@/lib/web3";

interface BlockchainVerificationCardProps {
    issueId: string;
}

export function BlockchainVerificationCard({ issueId }: BlockchainVerificationCardProps) {
    const [details, setDetails] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let mounted = true;
        async function fetchDetails() {
            try {
                setLoading(true);
                const data = await getIssueDetails(issueId);
                if (mounted) {
                    if (data) {
                        setDetails(data);
                    } else {
                        // If null, it means not verified or not found on chain.
                        setDetails(null);
                    }
                }
            } catch (e) {
                console.error("Verification fetch error", e);
                if (mounted) setError(true);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        fetchDetails();

        return () => {
            mounted = false;
        };
    }, [issueId]);

    if (loading) {
        return (
            <Card className="animate-pulse">
                <CardHeader className="h-8 bg-muted/20 w-1/2 mb-2 rounded"></CardHeader>
                <CardContent className="h-16 bg-muted/10 rounded"></CardContent>
            </Card>
        );
    }

    // If no details found, we render NOTHING. This handles the "Remove Mock" request.
    // We only show if it's actually on chain.
    if (!details || error) {
        return null;
    }

    return (
        <Card className="bg-accent/30 border-accent">
            <CardHeader>
                <CardTitle className="font-headline text-lg flex items-center gap-2 text-primary">
                    <CheckCircle className="text-green-600" /> Blockchain Verified
                </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
                <p className="text-muted-foreground">
                    This issue's metadata and acceptance status have been permanently recorded on the blockchain.
                </p>
                <div className="text-xs text-muted-foreground font-mono bg-background/50 p-2 rounded">
                    <p>Admin ID: {details.adminId}</p>
                    <p>Status: {details.status}</p>
                    <p>Verified: {new Date(details.timestamp * 1000).toLocaleDateString()}</p>
                </div>
                <Button asChild variant="link" className="p-0 h-auto">
                    <a
                        href={`https://amoy.polygonscan.com/address/${CONTRACT_ADDRESS}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        View Contract <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                </Button>
            </CardContent>
        </Card>
    );
}
