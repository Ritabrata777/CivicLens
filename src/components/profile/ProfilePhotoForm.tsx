"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Camera, CheckCircle2, Loader2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { type ProfilePhotoFormState, updateProfilePhotoAction } from "@/server/auth-actions";
import { cn } from "@/lib/utils";

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <Button type="submit" className="gap-2">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            {pending ? "Updating..." : "Save Photo"}
        </Button>
    );
}

const initialState: ProfilePhotoFormState = {
    message: "",
    success: false,
};

export function ProfilePhotoForm() {
    const { toast } = useToast();
    const [state, formAction] = useActionState(updateProfilePhotoAction, initialState);
    const [selectedFileName, setSelectedFileName] = useState("");
    const [open, setOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const helperText = useMemo(() => {
        if (!selectedFileName) {
            return "PNG or JPG works best for a clean profile look.";
        }

        return selectedFileName;
    }, [selectedFileName]);

    useEffect(() => {
        if (!state.message) {
            return;
        }

        toast({
            title: state.success ? "Updated" : "Error",
            description: state.message,
            variant: state.success ? "default" : "destructive",
        });

        if (state.success) {
            setSelectedFileName("");
            setOpen(false);
            if (inputRef.current) {
                inputRef.current.value = "";
            }
        }
    }, [state, toast]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 rounded-full px-5">
                    <Camera className="h-4 w-4" />
                    Change Profile Photo
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Change profile photo</DialogTitle>
                    <DialogDescription>
                        Upload a new picture for your public profile.
                    </DialogDescription>
                </DialogHeader>
                <form action={formAction} className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm">
                    <div className="space-y-3">
                        <label
                            htmlFor="profile-photo-upload"
                            className={cn(
                                "flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-primary/35 bg-primary/5 px-4 py-3 transition-colors hover:border-primary/60 hover:bg-primary/10",
                                selectedFileName && "border-emerald-500/40 bg-emerald-500/5"
                            )}
                        >
                            <div className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary",
                                selectedFileName && "bg-emerald-500/15 text-emerald-600"
                            )}>
                                {selectedFileName ? <CheckCircle2 className="h-5 w-5" /> : <UploadCloud className="h-5 w-5" />}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground">
                                    {selectedFileName ? "Photo selected" : "Choose a new image"}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">{helperText}</p>
                            </div>
                        </label>

                        <input
                            ref={inputRef}
                            id="profile-photo-upload"
                            name="profilePhoto"
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(event) => setSelectedFileName(event.target.files?.[0]?.name ?? "")}
                        />

                        <div className="flex justify-end">
                            <SubmitButton />
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
