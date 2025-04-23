"use client"

import { SidebarIcon } from "lucide-react"

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/sidebar"
import { ModeToggle } from "./ui/theme-toggle"

export function SiteHeader() {
    const { toggleSidebar } = useSidebar()

    return (
        <header className="bg-background sticky top-0 z-50 flex w-full items-center border-b">
            <div className="flex h-(--header-height) w-full items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <Button
                        className="h-8 w-8"
                        variant="ghost"
                        size="icon"
                        onClick={toggleSidebar}
                    >
                        <SidebarIcon />
                    </Button>
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    {/* <Breadcrumb className="hidden sm:block">
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="#">
                                    Breadcrumb 1
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Breadcrumb 2</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb> */}
                </div>
                <ModeToggle />
            </div>
        </header>
    )
}
