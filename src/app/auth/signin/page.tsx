"use client";

import { RoleSelector } from '@/components/auth/RoleSelector';
import { SignInButton } from '@/components/auth/SignInButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SignInPage() {
    // 1. GET THE `update` FUNCTION FROM `useSession`
    const { data: session, status, update } = useSession();
    const router = useRouter();
    const [needsRole, setNeedsRole] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (status === 'authenticated') {
            if (!session.user.role) {
                setNeedsRole(true);
            } else {
                // Redirect based on role
                if (session.user.role === 'seller') {
                    router.push('/dashboard/seller');
                } else {
                    router.push('/dashboard/buyer');
                }
            }
        }
    }, [session, status, router]);

    const handleRoleSelect = async (role: 'seller' | 'buyer') => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/auth/setup-role', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role }),
            });

            if (response.ok) {
                // 2. THIS IS THE CRITICAL NEW STEP
                // Tell NextAuth to refetch the session, which will now include the new role
                await update();

                // The useEffect hook will now re-run with the updated session
                // and handle the redirect automatically.

            } else {
                // Handle error, maybe with a toast
                console.error('Failed to set role');
            }
        } catch (error) {
            console.error('Error setting role:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (status === 'loading') {
        return <div className="min-h-screen flex items-center justify-center"><p>Loading session...</p></div>;
    }

    if (session && needsRole) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <RoleSelector onRoleSelect={handleRoleSelect} isLoading={isLoading} />
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="w-full max-w-sm">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Welcome</CardTitle>
                        <CardDescription>Sign in to get started</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <SignInButton />
                    </CardContent>
                </Card>
            </div>
        );
    }

    // This is a fallback for when the user is authenticated but the redirect is happening
    return <div className="min-h-screen flex items-center justify-center"><p>Redirecting...</p></div>;
}

