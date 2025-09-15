/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { SelectedSlot } from "./TimeSlotPicker";

const bookingSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters long"),
    description: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingFormProps {
    seller: { _id: string; name: string; };
    selectedSlot: SelectedSlot;
}

export function BookingForm({ seller, selectedSlot }: BookingFormProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<BookingFormData>({
        resolver: zodResolver(bookingSchema),
        defaultValues: {
            // Pre-fill the title for convenience
            title: `Meeting with ${session?.user?.name?.split(' ')[0] || 'me'}`,
        }
    });

    const onSubmit = async (data: BookingFormData) => {
        setLoading(true);
        try {
            // Combine date and time to create full ISO strings for the server
            const startTimeISO = new Date(`${format(selectedSlot.date, 'yyyy-MM-dd')}T${selectedSlot.startTime}:00`).toISOString();
            const endTimeISO = new Date(`${format(selectedSlot.date, 'yyyy-MM-dd')}T${selectedSlot.endTime}:00`).toISOString();

            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sellerId: seller._id,
                    startTime: startTimeISO,
                    endTime: endTimeISO,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    title: data.title,
                    description: data.description,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Booking failed');
            }

            toast.success("Appointment Booked!", {
                description: "Your meeting has been confirmed and added to your calendar.",
            });
            // Redirect to a page where they can see all their appointments
            router.push('/appointments');

        } catch (error: any) {
            toast.error("Booking Failed", {
                description: error.message || "Could not book the appointment. Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>3. Confirm Your Details</CardTitle>
                <CardDescription>Review the details and confirm your booking.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="p-4 bg-gray-50 rounded-lg mb-4 border">
                    <p className="font-semibold text-sm">Appointment with: <span className="font-normal">{seller.name}</span></p>
                    <p className="font-semibold text-sm">Date: <span className="font-normal">{format(selectedSlot.date, 'EEEE, MMMM dd, yyyy')}</span></p>
                    <p className="font-semibold text-sm">Time: <span className="font-normal">{selectedSlot.startTime} - {selectedSlot.endTime}</span></p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <Label htmlFor="title">Appointment Title</Label>
                        <Input id="title" {...register('title')} />
                        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
                    </div>

                    <div>
                        <Label htmlFor="description">Additional Notes (Optional)</Label>
                        <Textarea id="description" {...register('description')} rows={3} />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Confirming...' : 'Confirm & Book Appointment'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

