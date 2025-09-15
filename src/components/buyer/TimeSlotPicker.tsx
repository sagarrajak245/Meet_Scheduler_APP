"use client";

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format, startOfDay } from 'date-fns';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react'; // 1. Import useCallback
import { toast } from 'sonner';

// Define the shape of a selected slot for state management
export interface SelectedSlot {
    date: Date;
    startTime: string;
    endTime: string;
}

interface TimeSlotPickerProps {
    sellerId: string;
    onSlotSelect: (slot: SelectedSlot | null) => void;
    selectedSlot: SelectedSlot | null;
}

export function TimeSlotPicker({ sellerId, onSlotSelect, selectedSlot }: TimeSlotPickerProps) {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [availableSlots, setAvailableSlots] = useState<{ start: string, end: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const buyerTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // 2. Wrap the async function in useCallback
    const fetchAvailableSlots = useCallback(async () => {
        if (!selectedDate) return;
        setLoading(true);
        setAvailableSlots([]); // Clear previous slots
        onSlotSelect(null);   // Clear selected slot when date changes
        try {
            const dateString = format(selectedDate, 'yyyy-MM-dd');
            const response = await fetch(
                `/api/sellers/${sellerId}/availability?date=${dateString}&timezone=${buyerTimezone}`
            );
            if (!response.ok) throw new Error('Failed to fetch slots');
            const data = await response.json();
            setAvailableSlots(data.slots || []);
        } catch (error) {
            console.error('Error fetching availability:', error);
            toast.error("Failed to load availability for this date.");
        } finally {
            setLoading(false);
        }
        // 3. Add its own dependencies here
    }, [selectedDate, sellerId, buyerTimezone, onSlotSelect]);

    useEffect(() => {
        if (selectedDate) {
            fetchAvailableSlots();
        }
        // 4. Now it's safe to add fetchAvailableSlots to this array
    }, [selectedDate, fetchAvailableSlots]);


    const handleSlotClick = (slot: { start: string, end: string }) => {
        if (!selectedDate) return;
        onSlotSelect({
            date: selectedDate,
            startTime: slot.start,
            endTime: slot.end,
        });
    };

    return (
        <div className="grid lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <CalendarIcon className="h-5 w-5" />
                        <span>1. Select a Date</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < startOfDay(new Date())} // Disable past dates
                        className="rounded-md border"
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Clock className="h-5 w-5" />
                        <span>2. Select a Time</span>
                    </CardTitle>
                    <CardDescription>
                        Showing times for: {selectedDate ? format(selectedDate, 'EEEE, MMMM dd') : '...'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading available slots...</div>
                    ) : availableSlots.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No available slots for this date.
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {availableSlots.map((slot, index) => (
                                <Button
                                    key={index}
                                    variant={
                                        selectedSlot?.startTime === slot.start &&
                                            selectedDate &&
                                            format(selectedSlot.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                                            ? 'default'
                                            : 'outline'
                                    }
                                    onClick={() => handleSlotClick(slot)}
                                >
                                    {slot.start}
                                </Button>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

