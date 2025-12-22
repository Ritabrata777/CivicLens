"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { SOSModal } from "../SOSModal";

export function HeaderMobile() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isSosModalOpen, setIsSosModalOpen] = useState(false);

    return (
        <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left">
                    <div className="flex flex-col gap-6 pt-10">
                        <Link href="/" className="flex items-center gap-2 font-bold text-primary text-lg" onClick={() => setMobileMenuOpen(false)}>
                            <span className="font-headline">Civic Lens</span>
                        </Link>
                        <Link href="/admin" className="text-sm font-medium hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>
                            Admin Portal
                        </Link>
                    </div>
                </SheetContent>
            </Sheet>

            <SOSModal isOpen={isSosModalOpen} onOpenChange={setIsSosModalOpen} />
        </div>
    );
}
