"use client";

import { MainLayout } from "@/components/layout/Layout";
import { SellerDashboard } from "@/components/seller/SellerDashboard";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SellerDashboardPage() {
    const { status } = useSession();
    const router = useRouter();

    // A simple effect to protect the route if the user is not authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/');
        }
    }, [status, router]);

    if (status !== 'authenticated') {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    // By wrapping the component here, we ensure it gets the header and navigation
    return (
        <MainLayout>
            <SellerDashboard />
        </MainLayout>
    );
}

