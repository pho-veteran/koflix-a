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
import { useBreadcrumbs } from "@/providers/breadcrumb-provider"
import { Fragment } from "react"

export function SiteHeader() {
    const { toggleSidebar } = useSidebar()
    const { breadcrumbs } = useBreadcrumbs()

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
                    {breadcrumbs.length > 0 && (
                        <Breadcrumb className="hidden sm:block">
                            <BreadcrumbList>
                                {breadcrumbs.map((item, index) => (
                                    <Fragment key={index}>
                                        <BreadcrumbItem>
                                            {index === breadcrumbs.length - 1 ? (
                                                <BreadcrumbPage>{item.label}</BreadcrumbPage>
                                            ) : (
                                                <BreadcrumbLink href={item.href || "#"}>
                                                    {item.label}
                                                </BreadcrumbLink>
                                            )}
                                        </BreadcrumbItem>
                                        {index < breadcrumbs.length - 1 && (
                                            <BreadcrumbSeparator />
                                        )}
                                    </Fragment>
                                ))}
                            </BreadcrumbList>
                        </Breadcrumb>
                    )}
                </div>
                <ModeToggle />
            </div>
        </header>
    )
}
