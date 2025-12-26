"use client";

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from "react";
import Link from "next/link";
import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"


export function DropdownMobileHeader() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { setTheme, resolvedTheme } = useTheme()
    
    return (
        <div className="md:hidden">
            <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <DropdownMenuTrigger asChild>
                    <Button size={"icon"} variant={"secondary"}>
                        {isMenuOpen ? <ChevronUp /> : <ChevronDown />}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-30" align="end" >
                    
                    <DropdownMenuLabel className="font-bold text-center">Menu</DropdownMenuLabel>
                    <DropdownMenuGroup>
                        <DropdownMenuItem>
                            <Link href="/profile">
                                Profile
                            </Link>
                        </DropdownMenuItem>
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                    Theme
                                    { resolvedTheme === "dark" ? ( <Moon /> ) : ( <Sun /> ) }
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                    <DropdownMenuSubContent>
                                        <DropdownMenuItem onClick={ () => { setTheme("dark") }}>
                                            Dark
                                            <Moon />
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={ () => { setTheme("light") }}>
                                            Light
                                            <Sun />
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={ () => { setTheme("system") }}>
                                            System
                                            <Monitor />
                                        </DropdownMenuItem>
                                    </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                            </DropdownMenuSub>
                        <DropdownMenuItem>
                            Settings
                        </DropdownMenuItem>
                    </DropdownMenuGroup>

                  <DropdownMenuSeparator />
                  
                    <DropdownMenuItem className={`${resolvedTheme === "dark" ? 'bg-red-800' : 'bg-violet-400' }`}>
                        <Link href="/admin">
                            <div className="font-semibold px-2 py-0.5">
                                Admin Portal
                            </div>
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}