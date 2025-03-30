import { redirect } from "next/navigation";
import { verifySessionCookie } from "@/lib/server-auth";

export default async function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Check if already authenticated to prevent accessing auth pages when logged in
    const { authenticated } = await verifySessionCookie();

    // If already authenticated, redirect to home or dashboard
    if (authenticated) {
        redirect('/');
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            {children}
        </div>
    );
}