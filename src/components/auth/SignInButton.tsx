"use client";

import { Button } from "@/components/ui/button";
import { LogIn, LogOut } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";

// This component intelligently displays either a "Sign In" or "Sign Out"
// button based on the user's current login status.
export function SignInButton() {
    // The useSession hook is the primary way to access session data in client components.
    const { data: session, status } = useSession();

    // 'status' can be 'loading', 'authenticated', or 'unauthenticated'.
    // We show a disabled button while the session status is being determined.
    if (status === "loading") {
        return <Button variant="outline" disabled>Loading...</Button>;
    }

    // If a session object exists, it means the user is successfully authenticated.
    if (session) {
        return (
            <div className="flex items-center gap-4">
                <p className="text-sm text-gray-800">Signed in as {session.user?.email}</p>
                <Button variant="outline" onClick={() => signOut({ callbackUrl: '/' })}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </Button>
            </div>
        );
    }

    // If there's no session, the user is unauthenticated.
    // The signIn('google') function initiates the authentication flow with the Google provider.
    return (
        <Button onClick={() => signIn("google")}>
            <LogIn className="mr-2 h-4 w-4" />
            Sign in with Google
        </Button>
    );
}

