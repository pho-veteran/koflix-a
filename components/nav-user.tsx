"use client"

import {
    ChevronsUpDown,
    LogOut,
    Loader2,
    KeyRound,
    SquareUser
} from "lucide-react"

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"

import { signOut } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react"

export function NavUser({
    user,
    isLoading = false
}: {
    user: {
        name: string
        emailOrPhone: string
        avatarUrl: string
    },
    isLoading?: boolean
}) {
    const [isMounted, setIsMounted] = useState(false)
    const { isMobile } = useSidebar()
    const router = useRouter()

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const handleSignOut = async () => {
        try {
            await signOut();

            localStorage.setItem('auth_logout', Date.now().toString());

            router.push("/login");
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    if (!isMounted) return null

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span>Loading...</span>
                                </div>
                            ) : (
                                <>
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                                        <AvatarFallback className="rounded-lg">
                                            {user.name?.substring(0, 2).toUpperCase() || "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-medium">{user.name}</span>
                                        <span className="truncate text-xs">{user.emailOrPhone}</span>
                                    </div>
                                    <ChevronsUpDown className="ml-auto size-4" />
                                </>
                            )}
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                                    <AvatarFallback className="rounded-lg">
                                        {user.name?.substring(0, 2).toUpperCase() || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">{user.name}</span>
                                    <span className="truncate text-xs">{user.emailOrPhone}</span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem>
                                <KeyRound className="mr-2 h-4 w-4" />
                                Change Password
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuGroup>
                            <DropdownMenuItem>
                                <SquareUser className="mr-2 h-4 w-4" />
                                Change Avatar
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSignOut}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
