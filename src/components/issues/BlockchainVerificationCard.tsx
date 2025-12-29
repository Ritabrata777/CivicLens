import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ExternalLink } from "lucide-react";
import type { BlockchainTransaction } from "@/lib/types";

interface BlockchainVerificationCardProps {
    transaction?: BlockchainTransaction;
}

export function BlockchainVerificationCard({ transaction }: BlockchainVerificationCardProps) {
    if (!transaction) {
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
                <div className="flex flex-col gap-1">
                    <span className="font-medium">Issue {transaction.status}</span>
                    <a
                        href={transaction.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary transition-colors break-all hover:underline"
                    >
                        {transaction.txHash}
                        <ExternalLink className="w-3 h-3 inline ml-1" />
                    </a>
                </div>
            </CardContent>
        </Card>
    );
}
