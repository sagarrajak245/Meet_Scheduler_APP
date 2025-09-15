/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { BookingForm } from '@/components/buyer/BookingForm';
import { SelectedSlot, TimeSlotPicker } from '@/components/buyer/TimeSlotPicker';
import { MainLayout } from '@/components/layout/Layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from 'next-auth/react';
import { use, useEffect, useState } from 'react';

// Define the shape of the seller for state
type Seller = {
    _id: string;
    name: string;
    email: string;
    image: string;
};

// The page component receives params from the dynamic route
export default function BookingPage({ params }: { params: Promise<{ sellerId: string }> }) {
    // Use React.use() to unwrap the Promise
    const { sellerId } = use(params);
    const { data: session, status } = useSession({ required: true }); // Ensure user is logged in

    const [seller, setSeller] = useState<Seller | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (sellerId) {
            const fetchSeller = async () => {
                try {
                    setLoading(true);
                    const response = await fetch(`/api/sellers/${sellerId}`);
                    if (!response.ok) throw new Error("Seller not found");
                    const data = await response.json();
                    setSeller(data);
                } catch (error) {
                    console.error('Error fetching seller:', error);
                    // Handle error, e.g., redirect to a not-found page
                } finally {
                    setLoading(false);
                }
            };
            fetchSeller();
        }
    }, [sellerId]);

    if (status === 'loading' || loading) {
        return (
            <MainLayout>
                <div className="text-center p-10">Loading booking page...</div>
            </MainLayout>
        );
    }

    if (!seller) {
        return (
            <MainLayout>
                <div className="container mx-auto p-6 text-center">
                    <h1 className="text-2xl font-bold">Seller Not Found</h1>
                    <p>The seller you are trying to book with could not be found.</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="container mx-auto p-4 md:p-8">
                {/* Seller Info Header */}
                <Card className="mb-8">
                    <CardHeader>
                        <div className="flex items-center space-x-4">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={seller.image} alt={seller.name} />
                                <AvatarFallback>{seller.name.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-2xl">Book an Appointment with {seller.name}</CardTitle>
                                <p className="text-muted-foreground">{seller.email}</p>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Time Slot Selection */}
                    <div className="lg:col-span-2">
                        <TimeSlotPicker
                            sellerId={sellerId}
                            onSlotSelect={setSelectedSlot}
                            selectedSlot={selectedSlot}
                        />
                    </div>

                    {/* --- THIS IS THE UPDATED PART --- */}
                    <div className="lg:col-span-1">
                        {selectedSlot ? (
                            // If a slot is selected, show the real booking form
                            <BookingForm seller={seller} selectedSlot={selectedSlot} />
                        ) : (
                            // If not, show the prompt
                            <Card>
                                <CardHeader>
                                    <CardTitle>3. Confirm Your Details</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-center text-muted-foreground py-8">
                                        Please select a time slot to continue.
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}

