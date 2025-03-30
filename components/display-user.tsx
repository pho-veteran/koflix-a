"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useEffect, useState } from "react";

const DisplayUser = () => {
    const [isMounted, setIsMounted] = useState(false);
    const { user, loading } = useCurrentUser();

    useEffect(() => {
        setIsMounted(true);
        return () => setIsMounted(false);
    }, []);

    if (!isMounted) return null;

    if (loading || !user) {
        return (
            <div className="flex items-center justify-center p-4">
                <p className="text-muted-foreground">
                    {loading ? "Loading..." : "No user logged in"}
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 p-4">
            <h2 className="text-lg font-bold">User Information</h2>
            <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Email: {user.email}</p>
                <p className="text-sm font-medium">UID: {user.uid}</p>
                <p className="text-sm font-medium">Display Name: {user.displayName || "N/A"}</p>
                <p className="text-sm font-medium">Phone Number: {user.phoneNumber || "N/A"}</p>
            </div>
        </div>
    );
}

export default DisplayUser;