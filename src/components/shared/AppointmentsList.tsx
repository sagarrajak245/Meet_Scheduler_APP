/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { toast } from "sonner"; // Import toast for notifications
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

    // This function can now be called to refresh the list
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

    useEffect(() => {
        fetchBookings();
    }, []);


    const handleCancelBooking = async (bookingId: string) => {
        // A simple confirmation dialog for a better user experience
        if (!window.confirm("Are you sure you want to cancel this appointment? This action cannot be undone.")) {
            return;
        }

        try {
            const response = await fetch(`/api/bookings/${bookingId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to cancel the booking.');
            }

            toast.success("Appointment Cancelled", {
                description: "The appointment has been successfully cancelled and removed from your calendar.",
            });

            // Refresh the list from the server to show the updated status
            fetchBookings();

        } catch (error) {
            toast.error("Cancellation Failed", {
                description: "Could not cancel the appointment. Please try again.",
            });
        }
    };

    // Refined logic for sorting bookings
    const now = new Date();
    const upcomingBookings = bookings.filter(b => new Date(b.startTime) >= now && b.status === 'confirmed');
    const pastBookings = bookings.filter(b => new Date(b.startTime) < now || b.status !== 'confirmed');


    if (loading) {
        return <div className="text-center p-10">Loading your appointments...</div>
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-8">My Appointments</h1>
            <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upcoming">Upcoming ({upcomingBookings.length})</TabsTrigger>
                    <TabsTrigger value="past">Past & Cancelled ({pastBookings.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="upcoming" className="mt-6">
                    {upcomingBookings.length > 0 ? (
                        <div className="space-y-4">
                            {/* Pass the handler function down to each card */}
                            {upcomingBookings.map(booking =>
                                <BookingCard
                                    key={booking._id}
                                    booking={booking}
                                    onCancel={handleCancelBooking}
                                />
                            )}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-16">No upcoming appointments scheduled.</p>
                    )}
                </TabsContent>
                <TabsContent value="past" className="mt-6">
                    {pastBookings.length > 0 ? (
                        <div className="space-y-4">
                            {pastBookings.map(booking =>
                                <BookingCard
                                    key={booking._id}
                                    booking={booking}
                                /> // No cancel handler for past bookings
                            )}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-16">You have no past or cancelled appointments.</p>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

