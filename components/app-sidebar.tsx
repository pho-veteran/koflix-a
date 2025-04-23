"use client"

import * as React from "react"
import axios from "axios"
import {
    Command,
    LifeBuoy,
    Send,
    Film,
    Globe,
    Tags,
    Users,
    FileVideo2
} from "lucide-react"
import { useState, useEffect } from "react"

import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { NavList } from "@/components/nav-list"
import { useCurrentUser } from "@/hooks/use-current-user"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"
import Image from "next/image"

type UserData = {
    name: string
    emailOrPhone: string
    avatarUrl: string
    role?: string
}

const data = {
    navSecondary: [
        {
            title: "Support",
            url: "#",
            icon: LifeBuoy,
        },
        {
            title: "Feedback",
            url: "#",
            icon: Send,
        },
    ],
    kkphim: [
        {
            name: "KKPhim API",
            url: "/kkphim-api",
            icon: () => <Image src="/kkphim-logo.png" alt="KKPhim Logo" width={18} height={18} />,
        },
    ],
    movies: [
        {
            name: "Genres",
            url: "/genres",
            icon: Tags,
        },
        {
            name: "Countries",
            url: "/countries",
            icon: Globe,
        },
        {
            name: "Movie Types",
            url: "/movie-types",
            icon: FileVideo2,
        },
        {
            name: "Movies",
            url: "/movies",
            icon: Film,
        },
    ],
    // users_management: [
    //     {
    //         name: "Users Management",
    //         url: "/users-management",
    //         icon: Users,
    //     }
    // ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { user: firebaseUser } = useCurrentUser();
    const [userData, setUserData] = useState<UserData>({
        name: "Loading...",
        emailOrPhone: "",
        avatarUrl: "/blank-avatar.svg"
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchUserData() {
            if (firebaseUser) {
                try {
                    const response = await axios.get('/api/users');
                    setUserData({
                        name: response.data.user.name,
                        emailOrPhone: response.data.user.emailOrPhone || "",
                        avatarUrl: response.data.user.avatarUrl || "/blank-avatar.svg",
                        role: response.data.user.role
                    });
                } catch (error) {
                    console.error("Error fetching user data:", error);
                    // Fallback to Firebase user data
                    setUserData({
                        name: firebaseUser.displayName || "User",
                        emailOrPhone: firebaseUser.email || firebaseUser.phoneNumber || "",
                        avatarUrl: firebaseUser.photoURL || "/blank-avatar.svg"
                    });
                } finally {
                    setIsLoading(false);
                }
            }
        }

        fetchUserData();
    }, [firebaseUser]);

    return (
        <Sidebar
            className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
            {...props}
        >
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard">
                                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                                    <Command className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">Koflix Admin</span>
                                    <span className="truncate text-xs">Movies Streaming API</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavList list={data.kkphim} navTitle="KKPhim" />
                <NavList list={data.movies} navTitle="Movies" />
                {/* <NavList list={data.users_management} navTitle="Administration" /> */}

                <NavSecondary items={data.navSecondary} className="mt-auto" />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={userData} isLoading={isLoading} />
            </SidebarFooter>
        </Sidebar>
    )
}
