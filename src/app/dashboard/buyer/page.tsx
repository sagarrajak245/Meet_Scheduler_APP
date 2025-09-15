"use client";

import { BuyerDashboard } from "@/components/buyer/BuyerDashboard";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function BuyerDashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        // Protect the route
        if (status === 'unauthenticated') {
            router.push('/api/auth/signin');
        }
        // Redirect if the user is not a buyer
        if (status === 'authenticated' && session.user.role !== 'buyer') {
            router.push('/dashboard/seller'); // or to a generic dashboard  
        }
    }, [session, status, router]);

    if (status === 'loading') {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    // Render the dashboard only for authenticated buyers
    if (session && session.user.role === 'buyer') {
        return <BuyerDashboard />;
    }

    // Fallback content, though the redirect should usually handle this
    return null;
}
