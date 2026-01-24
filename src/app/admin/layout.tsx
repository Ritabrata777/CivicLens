"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import Link from 'next/link';
import { LayoutDashboard, Settings, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminLogoutAction } from "@/server/actions";
import { connectWallet, isWalletConnected } from "@/lib/web3";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [adminName, setAdminName] = useState("");

  useEffect(() => {
    // Skip check on login page
    if (pathname === "/admin/login") {
      setAuthorized(true);
      setChecking(false);
      return;
    }

    const verifyAccess = async () => {
      try {
        const address = await isWalletConnected();
        console.log("Admin Layout Auth Check:", { address });

        if (!address) {
          console.log("No wallet connected, redirecting to login");
          router.replace("/admin/login");
          return;
        }

        // Check local session for name
        const session = localStorage.getItem("civic_admin_session");
        if (session) {
          try {
            const data = JSON.parse(session);
            if (data.address && data.address.toLowerCase() === address.toLowerCase()) {
              setAdminName(data.name);
            }
          } catch (e) {
            console.error("Error parsing session", e);
          }
        }

        // We removed whitelist check to allow anyone to login if they have registered
        // const isWhitelisted = checkIsAdminEnv(address);
        // if (!isWhitelisted) ...

        setAuthorized(true);

      } catch (e) {
        console.error("Auth check failed", e);
        router.replace("/admin/login");
      } finally {
        setChecking(false);
      }
    };

    verifyAccess();
  }, [pathname, router]);

  if (checking) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authorized && pathname !== "/admin/login") {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {pathname !== "/admin/login" && (
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-between">
            <div className="flex items-center gap-2 font-semibold">
              <LayoutDashboard className="h-5 w-5" />
              <span>Admin Dashboard</span>
            </div>

            <div className="flex items-center gap-4">
              {adminName && (
                <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full border border-border/50">
                  <User className="h-3.5 w-3.5" />
                  <span>Welcome, <span className="font-medium text-foreground">{adminName}</span></span>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await adminLogoutAction();
                  localStorage.removeItem("civic_admin_session");
                  router.push("/admin/login");
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>
      )}
      <div className="container mx-auto py-8 flex-1">
        {children}
      </div>
    </div>
  );
}

