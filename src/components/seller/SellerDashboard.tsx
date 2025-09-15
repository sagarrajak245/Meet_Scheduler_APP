"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSession } from 'next-auth/react';
import { AvailabilityEditor } from './AvailabilityEditor';

export function SellerDashboard() {
    const { data: session } = useSession();

    return (
        <div className="container mx-auto p-4 md:p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Seller Dashboard</h1>
                <p className=" text-slate-800">Welcome back, {session?.user?.name}</p>
            </div>

            <Tabs defaultValue="settings" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="calendar" disabled>Calendar</TabsTrigger>
                    <TabsTrigger value="bookings" disabled>Bookings</TabsTrigger>
                    <TabsTrigger value="analytics" disabled>Analytics</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="calendar">
                    {/* CalendarView will go here later */}
                </TabsContent>

                <TabsContent value="bookings">
                    {/* BookingsList will go here later */}
                </TabsContent>

                <TabsContent value="analytics">
                    {/* AnalyticsCharts will go here later */}
                </TabsContent>

                <TabsContent value="settings" className="mt-6">
                    <AvailabilityEditor />
                </TabsContent>
            </Tabs>
        </div>
    );
}
