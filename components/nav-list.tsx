"use client"

import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"

export function NavList({
    list,
    navTitle,
}: {
    list: {
        name: string
        url: string
        icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
    }[],
    navTitle: string
}) {
    return (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>{navTitle}</SidebarGroupLabel>
            <SidebarMenu>
                {list.map((item) => (
                    <SidebarMenuItem key={item.name} className="flex justify-between items-center">
                        <SidebarMenuButton asChild>
                            <Link href={item.url}>
                                <item.icon />
                                <span>{item.name}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    )
}
