"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { BookingCard } from "./BookingCard";

// Define a type for the booking object, consistent with BookingCard
interface Booking {
    _id: string;
    startTime: string;
    endTime: string;
    title: string;
    status: 'confirmed' | 'cancelled' | 'completed';
    googleMeetLink?: string;
    otherUser: {
        name: string;
        email: string;
        image: string;
    }
}

export function AppointmentsList() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/bookings');
                const data = await response.json();
                setBookings(data);
            } catch (error) {
                console.error("Failed to fetch appointments", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, []);

    const upcomingBookings = bookings.filter(b => new Date(b.startTime) >= new Date());
    const pastBookings = bookings.filter(b => new Date(b.startTime) < new Date());

    if (loading) {
        return <div className="text-center p-10">Loading your appointments...</div>
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-8">My Appointments</h1>
            <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upcoming">Upcoming ({upcomingBookings.length})</TabsTrigger>
                    <TabsTrigger value="past">Past ({pastBookings.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="upcoming" className="mt-6">
                    {upcomingBookings.length > 0 ? (
                        <div className="space-y-4">
                            {upcomingBookings.map(booking => <BookingCard key={booking._id} booking={booking} />)}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-16">No upcoming appointments scheduled.</p>
                    )}
                </TabsContent>
                <TabsContent value="past" className="mt-6">
                    {pastBookings.length > 0 ? (
                        <div className="space-y-4">
                            {pastBookings.map(booking => <BookingCard key={booking._id} booking={booking} />)}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-16">You have no past appointments.</p>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
