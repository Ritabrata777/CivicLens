"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth/AuthModal";
import { Bell, User as UserIcon, LogOut } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getNotificationsAction } from "@/server/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { IssueStatus } from "@/lib/types";
import { adminLogoutAction } from "@/server/actions";

interface Notification {
    issueId: string;
    title: string;
    status: IssueStatus;
    timestamp: Date;
}

interface HeaderActionsProps {
    isLoggedIn: boolean; // We might convert this to use a context or cookie check if needed client-side, 
    // but ideally passed from server or checked here via server action or cookie.
    // For now, let's accept it as a prop or check cookie client side? 
    // Checking cookie client side is easy.
}

export function HeaderActions({ isLoggedIn }: { isLoggedIn?: boolean }) {
    // If we receive the prop, use it. But we also might want a local state for logout updates?
    // Actually, if we use router.refresh() on logout, the server component will re-render and pass false.
    // So we can rely on props.

    // However, for immediate optimistic UI updates, local state is useful.
    // Let's initialize state from prop.
    const [localIsLoggedIn, setLocalIsLoggedIn] = useState(!!isLoggedIn);
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loadingNotifications, setLoadingNotifications] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const router = useRouter();

    // Sync state with prop if it changes (e.g. after router.refresh)
    useEffect(() => {
        setLocalIsLoggedIn(!!isLoggedIn);
    }, [isLoggedIn]);

    // ... rest of component using localIsLoggedIn

    // Fetch notifications when popover opens
    // Fetch notifications when popover opens
    useEffect(() => {
        if (localIsLoggedIn && notificationsOpen) {
            setLoadingNotifications(true);
            getNotificationsAction()
                .then(data => {
                    const parsed = data.map((n: any) => ({
                        ...n,
                        timestamp: new Date(n.timestamp)
                    }));
                    setNotifications(parsed);
                })
                .finally(() => setLoadingNotifications(false));
        }
    }, [localIsLoggedIn, notificationsOpen]);




    const handleLogout = async () => {
        // Optimistic update
        setLocalIsLoggedIn(false);
        setNotifications([]);

        // Server logout (clears httpOnly cookie)
        await adminLogoutAction();

        // Force reload/refresh
        router.refresh();
        window.location.reload();
    };

    if (localIsLoggedIn) {
        return (
            <div className="flex items-center gap-2">
                <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-5 w-5" />
                            {/* Simple logic: if notifications exist, show dot. Ideally tracking 'read' state. */}
                            {notifications.length > 0 && (
                                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-600" />
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="end">
                        <div className="p-4 font-semibold border-b">Notifications</div>
                        <div className="max-h-80 overflow-y-auto">
                            {loadingNotifications ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
                            ) : notifications.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">No recent updates.</div>
                            ) : (
                                <div className="divide-y">
                                    {notifications.map((n) => (
                                        <Link
                                            key={n.issueId + n.timestamp.toISOString()}
                                            href={`/issues/${n.issueId}`}
                                            className="block p-4 hover:bg-muted/50 transition-colors"
                                            onClick={() => setNotificationsOpen(false)}
                                        >
                                            <p className="text-sm font-medium">{n.title}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Status update: <span className="font-semibold text-primary">{n.status}</span>
                                            </p>
                                            <p className="text-[10px] text-muted-foreground mt-1 tabular-nums">
                                                {n.timestamp.toLocaleDateString()}
                                            </p>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>

                <Link href="/profile" className="hidden md:block">
                    <Button variant="ghost" size="icon">
                        <UserIcon className="h-5 w-5" />
                    </Button>
                </Link>

                <Button variant="ghost" size="icon" onClick={handleLogout} title="Sign Out">
                    <LogOut className="h-5 w-5" />
                </Button>
            </div>
        );
    }

    return (
        <>
            <Button onClick={() => setAuthModalOpen(true)} size="sm">
                Join Community
            </Button>
            <AuthModal isOpen={authModalOpen} onOpenChange={setAuthModalOpen} />
        </>
    );
}
