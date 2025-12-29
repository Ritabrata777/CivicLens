
"use client";

import { useActionState, useEffect, useState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { createUserAction, type RegistrationFormState } from "@/server/auth-actions";
import { Loader2, UploadCloud, CheckCircle, AlertCircle } from "lucide-react";
import { verifyVoterIdAction } from "@/ai/actions";
import { connectWallet } from "@/lib/web3";
import { Wallet, Eye, EyeOff } from "lucide-react";

const registrationSchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number is required"),
    residenceDuration: z.string().min(1, "This field is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    profilePhoto: z.any().optional(),
    voterIdNumber: z.string().min(5, "Voter ID number is required"),
    voterIdPhoto: z.any().refine(file => file instanceof File, "Voter ID photo is required"),
    voterIdPhotoBack: z.any().optional(),
    walletAddress: z.string().optional(),
});

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="w-full">
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create Account
        </Button>
    );
}

export function RegistrationForm() {
    const router = useRouter();
    const { toast } = useToast();
    const [verificationStatus, setVerificationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [verificationMessage, setVerificationMessage] = useState('');
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const voterIdPhotoRef = useRef<HTMLInputElement>(null);

    const [formState, formAction] = useActionState<RegistrationFormState, FormData>(createUserAction, { message: "", success: false });

    const form = useForm<z.infer<typeof registrationSchema>>({
        resolver: zodResolver(registrationSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            residenceDuration: "",
            password: "",

            voterIdNumber: "",
        },
    });

    useEffect(() => {
        if (formState.message) {
            if (formState.success) {
                toast({
                    title: "Account Created!",
                    description: formState.message,
                });
                router.push('/profile');
            } else {
                toast({
                    title: "Error",
                    description: formState.message,
                    variant: "destructive",
                });
            }
        }
    }, [formState, router, toast]);

    const handleConnectWallet = async () => {
        const address = await connectWallet();
        if (address) {
            setWalletAddress(address);
            form.setValue('walletAddress', address); // Optional: if you add it to the form schema as a field
            toast({ title: "Wallet Connected", description: `Connected: ${address.slice(0, 6)}...${address.slice(-4)}` });
        } else {
            toast({ title: "Connection Failed", description: "Could not connect to MetaMask.", variant: "destructive" });
        }
    };

    // Add effect to set wallet address in form when state changes
    useEffect(() => {
        if (walletAddress) {
            // We need to ensure the hidden input gets this value if we are relying on standard form submission
            // Or we can rely on the hidden input being rendered with the value
        }
    }, [walletAddress]);

    const handleVoterIdVerification = async () => {
        const values = form.getValues();
        const voterIdNumber = values.voterIdNumber;
        const voterIdPhoto = values.voterIdPhoto; // Retrieved from form state if managed there, or ref? 
        // The original code used a ref for photo1. The new code put it in form state via onChange.
        // Let's rely on form.getValues() since onChange updates the form field.
        // Wait, the previous code used `voterIdPhotoRef.current?.files?.[0]`.
        // My previous edit removed the ref usage from the render but kept the ref on the input?
        // Actually, looking at my previous edit: `ref={voterIdPhotoRef}` was preserved for Front input.
        // But for consistency let's use form.getValues if possible, or refs.
        // Since `voterIdPhoto` updates the form state, `form.getValues('voterIdPhoto')` should work if it stores the File object.

        // Let's grab both from form state (cleaner)
        const photoFront = values.voterIdPhoto as File;
        const photoBack = values.voterIdPhotoBack as File | undefined;

        if (!voterIdNumber || !photoFront || !photoBack) {
            toast({ title: "Missing Info", description: "Please provide both voter ID number and photo (Front & Back).", variant: "destructive" });
            return;
        }

        setVerificationStatus('loading');

        const readAsDataUrl = (file: File): Promise<string> => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        };

        try {
            const photoDataUri = await readAsDataUrl(photoFront);
            const photoBackDataUri = await readAsDataUrl(photoBack);

            const result = await verifyVoterIdAction({
                voterIdNumber,
                photoDataUri,
                photoBackDataUri
            });

            if (result.isValid) {
                setVerificationStatus('success');
                setVerificationMessage(result.reason);
                toast({ title: "Verification Successful", description: result.reason });
            } else {
                setVerificationStatus('error');
                setVerificationMessage(result.reason);
                toast({ title: "Verification Failed", description: result.reason, variant: "destructive" });
            }
        } catch (error) {
            console.error(error);
            setVerificationStatus('error');
            setVerificationMessage("Failed to process images.");
        }
    };

    return (
        <Form {...form}>
            <div className="mb-6 flex flex-col gap-2 p-4 border rounded-lg bg-secondary/20">
                <h3 className="font-medium flex items-center gap-2"><Wallet className="w-4 h-4" /> Connect Wallet</h3>
                <p className="text-sm text-muted-foreground">Connect your wallet to receive rewards for your community contributions.</p>
                {walletAddress ? (
                    <div className="text-sm font-mono bg-background p-2 rounded border truncate text-green-600 border-green-200">
                        {walletAddress}
                    </div>
                ) : (
                    <Button type="button" variant="outline" onClick={handleConnectWallet} className="w-full sm:w-auto">
                        Connect MetaMask
                    </Button>
                )}
            </div>

            <form action={formAction} className="space-y-6">
                <input type="hidden" name="walletAddress" value={walletAddress || ""} />
                <FormField control={form.control} name="profilePhoto" render={({ field: { value, onChange, ...fieldProps } }) => (
                    <FormItem>
                        <FormLabel>Profile Photo</FormLabel>
                        <FormControl>
                            <Input
                                {...fieldProps}
                                type="file"
                                accept="image/*"
                                onChange={(event) => {
                                    onChange(event.target.files?.[0]);
                                }}
                            />
                        </FormControl>
                        <FormDescription>Upload a photo for your profile.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <FormField control={form.control} name="residenceDuration" render={({ field }) => (
                    <FormItem><FormLabel>How long have you lived at your current address?</FormLabel><FormControl><Input {...field} placeholder="e.g., 5 years" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <Input type={showPassword ? "text" : "password"} {...field} />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <div className="space-y-2 pt-4 border-t">
                    <h3 className="font-medium">Voter ID Verification</h3>
                    <FormField control={form.control} name="voterIdNumber" render={({ field }) => (
                        <FormItem><FormLabel>Voter ID Card Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="voterIdPhoto" render={({ field: { value, onChange, ...fieldProps } }) => (
                            <FormItem>
                                <FormLabel>Voter ID (Front)</FormLabel>
                                <FormControl>
                                    <Input
                                        {...fieldProps}
                                        type="file"
                                        accept="image/*"
                                        ref={voterIdPhotoRef}
                                        onChange={(event) => {
                                            onChange(event.target.files?.[0]);
                                        }}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="voterIdPhotoBack" render={({ field: { value, onChange, ...fieldProps } }) => (
                            <FormItem>
                                <FormLabel>Voter ID (Back)</FormLabel>
                                <FormControl>
                                    <Input
                                        {...fieldProps}
                                        type="file"
                                        accept="image/*"
                                        onChange={(event) => {
                                            onChange(event.target.files?.[0]);
                                        }}
                                    />
                                </FormControl>
                                <FormDescription>Back side of ID.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>

                    <div className="flex items-center gap-4">
                        <Button type="button" variant="secondary" onClick={handleVoterIdVerification} disabled={verificationStatus === 'loading'}>
                            {verificationStatus === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud />}
                            Verify ID Now
                        </Button>
                        {verificationStatus === 'success' && <div className="flex items-center gap-2 text-sm text-green-600"><CheckCircle /><span>{verificationMessage}</span></div>}
                        {verificationStatus === 'error' && <div className="flex items-center gap-2 text-sm text-destructive"><AlertCircle /><span>{verificationMessage}</span></div>}
                    </div>
                </div>

                <SubmitButton />
            </form>
        </Form>
    );
}
