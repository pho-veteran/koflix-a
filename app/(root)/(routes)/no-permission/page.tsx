import { ShieldAlert } from "lucide-react";
import SignOutButton from "@/components/sign-out-btn";

export default function NoPermissionPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
            <div className="flex flex-col items-center max-w-md mx-auto space-y-4">
                <ShieldAlert className="w-16 h-16 text-red-500" />
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground">
                    You don&apos;t have permission to access this section. This area is restricted to administrators only.
                </p>
                <p className="text-muted-foreground">
                    Please contact your system administrator if you require access to this area.
                </p>
                <div className="mt-4">
                    <SignOutButton />
                </div>
            </div>
        </div>
    );
}