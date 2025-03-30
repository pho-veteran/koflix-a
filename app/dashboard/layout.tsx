import { redirect } from "next/navigation";
import { verifySessionCookie } from "@/lib/server-auth";

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

    return <>
        {children}
    </>;
}