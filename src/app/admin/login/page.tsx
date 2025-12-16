"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { connectWallet, checkIsAdminEnv, getAdminName, setAdminName } from "@/lib/web3";
import { Loader2, ShieldCheck, Wallet, UserCheck } from "lucide-react";
import { toast } from "sonner";

export default function AdminLoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [step, setStep] = useState<"connect" | "register">("connect");
    const [newName, setNewName] = useState("");

    const handleConnect = async () => {
        setLoading(true);
        try {
            const address = await connectWallet();
            if (!address) {
                toast.error("Failed to connect wallet");
                setLoading(false);
                return;
            }

            setWalletAddress(address);

            // Simulate slight delay for effect
            await new Promise(resolve => setTimeout(resolve, 800));

            const isWhitelisted = checkIsAdminEnv(address);
            if (!isWhitelisted) {
                toast.error("Access Denied: Wallet not in whitelist");
                setLoading(false);
                return;
            }

            const name = await getAdminName(address);
            if (name) {
                toast.success(`Welcome back, ${name}`);
                router.push("/admin/dashboard");
            } else {
                setStep("register");
                setLoading(false);
            }

        } catch (error) {
            console.error(error);
            toast.error("An error occurred during login");
            setLoading(false);
        }
    };

    const handleRegisterName = async () => {
        if (!newName.trim()) return;
        setLoading(true);
        try {
            await setAdminName(newName);
            toast.success("Name registered successfully!");
            router.push("/admin/dashboard");
        } catch (error) {
            console.error(error);
            toast.error("Failed to register name");
            setLoading(false);
        }
    };

    return (
        <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-background">
            {/* Ambient Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[100px] rounded-full animate-in fade-in duration-1000" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 blur-[100px] rounded-full animate-in fade-in duration-1000 delay-300" />
            </div>

            <Card className="relative z-10 w-full max-w-md border-muted/20 bg-background/60 backdrop-blur-xl shadow-2xl animate-in zoom-in-95 duration-500">
                <CardHeader className="text-center space-y-4 pb-2">
                    <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-2 ring-1 ring-primary/20">
                        <ShieldCheck className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold tracking-tight">Admin Portal</CardTitle>
                        <CardDescription className="text-base mt-2">
                            Secure access for verified administrators
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    {step === "connect" && (
                        <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="p-4 rounded-lg bg-secondary/50 border border-border/50 text-sm text-muted-foreground flex items-start gap-3">
                                <Wallet className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                <p>Connect your whitelisted MetaMask wallet to authenticate. Only authorized addresses can proceed.</p>
                            </div>
                            <Button size="lg" onClick={handleConnect} disabled={loading} className="w-full font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {loading ? "Verifying Credentials..." : "Connect Secure Wallet"}
                            </Button>
                        </div>
                    )}

                    {step === "register" && (
                        <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="p-4 rounded-lg bg-secondary/50 border border-border/50 text-sm text-muted-foreground flex items-start gap-3">
                                <UserCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                <p>Identity Verified. Please register your administrator name for on-chain records.</p>
                            </div>
                            <div className="space-y-3">
                                <label className="text-sm font-medium ml-1">Administrator Name</label>
                                <Input
                                    placeholder="e.g. Alice Smith"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="h-11 bg-background/50"
                                />
                            </div>
                            <Button size="lg" onClick={handleRegisterName} disabled={loading || !newName.trim()} className="w-full font-semibold shadow-lg shadow-primary/20">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {loading ? "Registering on Blockchain..." : "Complete Registration"}
                            </Button>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="pt-0 justify-center">
                    <p className="text-xs text-muted-foreground/60 text-center">
                        Secure Environment • End-to-End Encrypted • Blockchain Verified
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
