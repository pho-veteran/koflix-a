import { redirect } from "next/navigation";
import { verifySessionCookie } from "@/lib/server-auth";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/providers/theme-provider";
import { BreadcrumbProvider } from "@/providers/breadcrumb-provider";
import prisma from "@/lib/prisma";

export const iframeHeight = "800px"

export const description = "A sidebar with a header and a search form."

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Check authentication using server-side verification
    const { authenticated, userId } = await verifySessionCookie();

    // If not authenticated, redirect to login page
    if (!authenticated || !userId) {
        redirect(`/login`);
    }
    
    // Check user role from database
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
    });
    
    // If not admin, redirect to no-permission page
    if (!user || user.role !== "ADMIN") {
        redirect('/no-permission');
    }

    return (
        <>
            <div className="[--header-height:calc(--spacing(14))]">
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <BreadcrumbProvider>
                        <SidebarProvider className="flex flex-col">
                            <SiteHeader />
                            <div className="flex flex-1">
                                <AppSidebar />
                                <SidebarInset>
                                    {children}
                                </SidebarInset>
                            </div>
                        </SidebarProvider>
                    </BreadcrumbProvider>
                </ThemeProvider>
            </div>
        </>
    );
}