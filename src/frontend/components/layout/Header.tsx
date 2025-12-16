"use client";

import Link from "next/link";
import { Button } from "@/frontend/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/frontend/components/ui/sheet";
import { Menu, Siren } from "lucide-react";
import { useState } from "react";
import { SOSModal } from "../SOSModal";
import { ThemeToggle } from "./ThemeToggle";

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="text-sm font-medium text-primary/80 hover:text-primary transition-colors">
    {children}
  </Link>
);

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);

  return (
    <header className="bg-card shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-primary text-lg">

            <span className="font-headline">Civic Lens</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <NavLink href="/issues">Public Square</NavLink>
            <NavLink href="/report">Report Issue</NavLink>
            <NavLink href="/profile">Profile</NavLink>
            <NavLink href="/admin/dashboard">Admin Panel</NavLink>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />

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
                    <NavLink href="/issues">Public Square</NavLink>
                    <NavLink href="/report">Report Issue</NavLink>
                    <NavLink href="/profile">Profile</NavLink>
                    <NavLink href="/admin/dashboard">Admin Panel</NavLink>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
      <SOSModal isOpen={isSosModalOpen} onOpenChange={setIsSosModalOpen} />
    </header>
  );
}
