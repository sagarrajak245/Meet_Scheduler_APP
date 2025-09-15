"use client";

import { MainLayout } from "@/components/layout/Layout";
import { AppointmentsList } from "@/components/shared/AppointmentsList";
import { useSession } from "next-auth/react";

export default function AppointmentsPage() {
    // useSession can be used here for route protection if needed
    const { status } = useSession({ required: true });

    if (status === 'loading') {
        return (
            <MainLayout>
                <div className="text-center p-10">Loading...</div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <AppointmentsList />
        </MainLayout>
    );
}
