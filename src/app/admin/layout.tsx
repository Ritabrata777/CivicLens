"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import Link from 'next/link';
import { LayoutDashboard, Settings } from "lucide-react";
import { checkIsAdminEnv, connectWallet, isWalletConnected } from "@/lib/web3";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

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
        if (!address || !checkIsAdminEnv(address)) {
          router.replace("/admin/login");
        } else {
          setAuthorized(true);
        }
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
    <div className="container mx-auto py-8">
      {children}
    </div>
  );
}
