"use client";

import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

interface IssueImageLightboxProps {
    imageUrl: string;
    title: string;
    imageHint?: string;
    className?: string; // Add className prop
}

export function IssueImageLightbox({
    imageUrl,
    title,
    imageHint,
    className,
}: IssueImageLightboxProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <div
                    className={cn(
                        "relative cursor-pointer hover:opacity-95 transition-opacity overflow-hidden", // Base classes
                        className // Merge custom classes
                    )}
                    onClick={() => setIsOpen(true)}
                >
                    <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        className="object-cover"
                        data-ai-hint={imageHint}
                    />
                </div>
            </DialogTrigger>
            <DialogContent className="max-w-4xl border-none bg-transparent p-0">
                <DialogTitle className="sr-only">Issue Image</DialogTitle>
                <div
                    className="relative w-full h-[85vh] flex items-center justify-center pointer-events-none"
                    onClick={() => setIsOpen(false)}
                >
                    <div className="relative w-full h-full pointer-events-auto">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={imageUrl}
                            alt={title}
                            className="object-contain w-full h-full rounded-md shadow-2xl"
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
