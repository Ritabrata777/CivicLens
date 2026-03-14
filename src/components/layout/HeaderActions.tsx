"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth/AuthModal";
import { Bell, User as UserIcon, LogOut } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getNotificationsAction } from "@/server/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { AppNotification } from "@/lib/types";
import { adminLogoutAction } from "@/server/actions";

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
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loadingNotifications, setLoadingNotifications] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const router = useRouter();
    const { toast } = useToast();
    const seenNotificationIds = useRef<Set<string>>(new Set());
    const hasLoadedNotifications = useRef(false);
    const audioContextRef = useRef<AudioContext | null>(null);

    const playSOSAlertSound = () => {
        if (typeof window === "undefined") {
            return;
        }

        const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) {
            return;
        }

        try {
            const context = audioContextRef.current ?? new AudioContextClass();
            audioContextRef.current = context;

            if (context.state === "suspended") {
                void context.resume().catch(() => undefined);
            }

            const now = context.currentTime;
            const masterGain = context.createGain();
            masterGain.gain.setValueAtTime(0.0001, now);
            masterGain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
            masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
            masterGain.connect(context.destination);

            const pulseOne = context.createOscillator();
            pulseOne.type = "sine";
            pulseOne.frequency.setValueAtTime(880, now);
            pulseOne.frequency.exponentialRampToValueAtTime(660, now + 0.35);
            pulseOne.connect(masterGain);
            pulseOne.start(now);
            pulseOne.stop(now + 0.35);

            const pulseTwo = context.createOscillator();
            pulseTwo.type = "triangle";
            pulseTwo.frequency.setValueAtTime(988, now + 0.42);
            pulseTwo.frequency.exponentialRampToValueAtTime(740, now + 0.95);
            pulseTwo.connect(masterGain);
            pulseTwo.start(now + 0.42);
            pulseTwo.stop(now + 0.95);
        } catch {
            // Ignore sound failures so notification polling keeps working.
        }
    };

    // Sync state with prop if it changes (e.g. after router.refresh)
    useEffect(() => {
        setLocalIsLoggedIn(!!isLoggedIn);
    }, [isLoggedIn]);

    // ... rest of component using localIsLoggedIn

    const loadNotifications = (emitLiveAlerts = false) => {
        setLoadingNotifications(true);
        getNotificationsAction()
            .then(data => {
                const parsed = data.map((n: any) => ({
                    ...n,
                    timestamp: new Date(n.timestamp)
                }));

                const nextSeenIds = new Set(parsed.map((item: AppNotification) => item.id));

                if (emitLiveAlerts && hasLoadedNotifications.current) {
                    const newNotifications = parsed.filter((item: AppNotification) => !seenNotificationIds.current.has(item.id));

                    newNotifications
                        .filter((item: AppNotification) => item.kind === 'sos_alert')
                        .forEach((item: AppNotification) => {
                            playSOSAlertSound();
                            toast({
                                title: item.title,
                                description: item.message,
                            });

                            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                                new Notification(item.title, {
                                    body: item.message,
                                });
                            }
                        });
                }

                seenNotificationIds.current = nextSeenIds;
                hasLoadedNotifications.current = true;
                setNotifications(parsed);
            })
            .finally(() => setLoadingNotifications(false));
    };

    useEffect(() => {
        if (localIsLoggedIn && notificationsOpen) {
            loadNotifications();
        }
    }, [localIsLoggedIn, notificationsOpen]);

    useEffect(() => {
        if (!localIsLoggedIn) {
            return;
        }

        loadNotifications();
        const intervalId = window.setInterval(() => loadNotifications(true), 10000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [localIsLoggedIn]);

    useEffect(() => {
        if (!localIsLoggedIn) {
            return;
        }

        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().catch(() => undefined);
        }
    }, [localIsLoggedIn]);




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
                                            key={n.id + n.timestamp.toISOString()}
                                            href={n.href}
                                            className="block p-4 hover:bg-muted/50 transition-colors"
                                            onClick={() => setNotificationsOpen(false)}
                                        >
                                            <p className="text-sm font-medium">{n.title}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                                            {n.status ? (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Status: <span className="font-semibold text-primary">{n.status}</span>
                                                </p>
                                            ) : null}
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
