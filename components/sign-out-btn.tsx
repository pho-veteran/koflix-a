"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface SignOutButtonProps {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
    className?: string;
    showIcon?: boolean;
    asChild?: boolean;
}

export default function SignOutButton({
    variant = "default",
    size = "default",
    className,
    showIcon = true,
    asChild = false,
}: SignOutButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const isMounted = useRef(true);

    // Handle component unmounting
    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    const handleSignOut = async () => {
        try {
            setIsLoading(true);
            await signOut();
            
            // Signal other tabs about logout
            localStorage.setItem('auth_logout', Date.now().toString());
            
            // Redirect to login page after successful logout
            router.push("/login");
        } catch (error) {
            console.error("Error signing out:", error);
            if (isMounted.current) {
                toast.error("There was a problem signing you out. Please try again.");
            }
        } finally {
            if (isMounted.current) {
                setIsLoading(false);
            }
        }
    };

    return (
        <Button
            variant={variant}
            size={size}
            className={cn(className)}
            onClick={handleSignOut}
            disabled={isLoading}
            asChild={asChild}
        >
            {isLoading ? (
                <span className="flex items-center gap-2">
                    <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        ></circle>
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                    Signing out...
                </span>
            ) : (
                <span className="flex items-center gap-2">
                    {showIcon && <LogOut className="h-4 w-4" />}
                    Sign out
                </span>
            )}
        </Button>
    );
}
