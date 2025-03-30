import { redirect } from "next/navigation";
import { verifySessionCookie } from "@/lib/server-auth";
import SessionRefresher from "@/components/session-refresher";

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { authenticated } = await verifySessionCookie();

    if (!authenticated) {
        redirect(`/login`);
    }

    return (
        <>
            <SessionRefresher />
            
            {children}
        </>
    );
}