import { redirect } from "next/navigation";
import { verifySessionCookie } from "@/lib/server-auth";
import SessionRefresher from "@/components/session-refresher";
import prisma from "@/lib/prisma";

export default async function RootLayout({
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
    
    if (user && user.role === "ADMIN") {
        // If user is admin, redirect to dashboard
        redirect('/dashboard');
    }

    return (
        <>
            <SessionRefresher />
            {children}
        </>
    );
}