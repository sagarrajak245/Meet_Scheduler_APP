/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { BookingCard } from "../shared/BookingCard";
import { AnalyticsCharts } from "./AnalyticsCharts";
import { AvailabilityEditor } from "./AvailabilityEditor";

// Define a type for the data we expect to fetch
interface Booking {
    _id: string;
    startTime: string;
    // ... add other booking properties if needed for the card
    [key: string]: any; // Allow other properties
}

interface AnalyticsData {
    bookingTrends: { date: string; bookings: number }[];
    popularTimeSlots: { hour: string; bookings: number }[];
}

export function SellerDashboard() {
    const { data: session } = useSession();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    // Use a single useEffect to fetch all necessary data on load
    useEffect(() => {
        const fetchData = async () => {
            if (!session?.user?.id) return;

            try {
                setLoading(true);
                // Fetch bookings and analytics data in parallel for efficiency
                const [bookingsRes, analyticsRes] = await Promise.all([
                    fetch('/api/bookings'),
                    fetch(`/api/analytics/seller/${session.user.id}`)
                ]);

                const bookingsData = await bookingsRes.json();
                const analyticsData = await analyticsRes.json();

                setBookings(bookingsData);
                setAnalytics(analyticsData);

            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [session]);

    const upcomingBookings = bookings.filter(b => new Date(b.startTime) >= new Date());

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Seller Dashboard</h1>
                <p className="text-muted-foreground">Welcome back, {session?.user?.name}</p>
            </div>

            <Tabs defaultValue="bookings" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    {/* Enable the tabs now that we have content for them */}
                    <TabsTrigger value="bookings">Bookings</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                    <TabsTrigger value="calendar" disabled>Calendar View</TabsTrigger>
                </TabsList>

                <TabsContent value="bookings" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Upcoming Bookings</CardTitle>
                            <CardDescription>You have {upcomingBookings.length} upcoming appointments.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {loading ? (
                                <p>Loading bookings...</p>
                            ) : upcomingBookings.length > 0 ? (
                                upcomingBookings.slice(0, 5).map((booking) => (
                                    <BookingCard key={booking._id} booking={booking as any} />
                                ))
                            ) : (
                                <p className="text-center text-muted-foreground py-10">No upcoming bookings.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="analytics" className="mt-6">
                    <AnalyticsCharts analytics={analytics} />
                </TabsContent>

                <TabsContent value="settings" className="mt-6">
                    <AvailabilityEditor />
                </TabsContent>

                <TabsContent value="calendar" className="mt-6">
                    {/* Calendar View component will go here in a future step */}
                </TabsContent>
            </Tabs>
        </div>
    );
}

