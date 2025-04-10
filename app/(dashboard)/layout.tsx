import { redirect } from "next/navigation";
import { verifySessionCookie } from "@/lib/server-auth";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/providers/theme-provider";

export const iframeHeight = "800px"

export const description = "A sidebar with a header and a search form."

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Check authentication using server-side verification
    const { authenticated } = await verifySessionCookie();

    // If not authenticated, redirect to login page
    if (!authenticated) {
        redirect(`/login`);
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

                    <SidebarProvider className="flex flex-col">
                        <SiteHeader />
                        <div className="flex flex-1">
                            <AppSidebar />
                            <SidebarInset>
                                {children}
                            </SidebarInset>
                        </div>
                    </SidebarProvider>
                </ThemeProvider>
            </div>

        </>
    );
}