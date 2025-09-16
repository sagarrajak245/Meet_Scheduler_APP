/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleCalendarService } from '@/lib/google-calendar';
import clientPromise from '@/lib/mongodb';
import { add, format, isToday, parse, startOfDay } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';

// CRITICAL FIX #1: Force this route to be dynamic. This disables caching and ensures
// the function re-runs on every request, preventing the double-booking bug.  
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ sellerId: string }> }) {
    try {
        const { sellerId } = await params;
        const searchParams = request.nextUrl.searchParams;
        const date = searchParams.get('date'); // Expects 'YYYY-MM-DD'
        const timezone = searchParams.get('timezone') || 'UTC';

        if (!date) {
            return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(process.env.DATABASE_NAME);

        if (!ObjectId.isValid(sellerId)) {
            return NextResponse.json({ error: 'Invalid Seller ID format' }, { status: 400 });
        }

        const seller = await db.collection("users").findOne({ _id: new ObjectId(sellerId) });

        if (!seller || seller.role !== 'seller' || !seller.preferences) {
            return NextResponse.json({ error: 'Seller not found or availability not set' }, { status: 404 });
        }

        const { workingHours, bufferTime } = seller.preferences;
        const meetingDuration = 30;

        // CRITICAL FIX #2: Handle timezones correctly from the start.
        // We create Date objects that are aware of the buyer's timezone.
        const requestedDate = fromZonedTime(date, timezone);
        const dayStart = startOfDay(requestedDate);
        const dayEnd = add(dayStart, { days: 1 });

        // Generate potential slots based on the seller's working hours IN THE CORRECT TIMEZONE.
        const potentialSlots = [];
        const sellerStartTime = parse(workingHours.start, 'HH:mm', requestedDate);
        const sellerEndTime = parse(workingHours.end, 'HH:mm', requestedDate);

        let currentSlot = sellerStartTime;

        while (currentSlot < sellerEndTime) {
            const slotEnd = add(currentSlot, { minutes: meetingDuration });
            if (slotEnd > sellerEndTime) break;

            potentialSlots.push({ start: currentSlot, end: slotEnd });
            currentSlot = add(currentSlot, { minutes: meetingDuration + bufferTime });
        }

        const calendarService = new GoogleCalendarService();
        await calendarService.setCredentialsForUser(sellerId);
        // Fetch busy slots from Google using timezone-aware start/end times.
        const busySlots = await calendarService.getFreeBusy(dayStart.toISOString(), dayEnd.toISOString(), timezone);

        // CRITICAL FIX #3: Filter out past slots and conflicts.
        const now = new Date();
        const availableSlots = potentialSlots.filter(slot => {
            // Rule 1: Don't show slots that have already passed on the current day.
            if (isToday(slot.start) && slot.start < now) {
                return false;
            }

            // Rule 2: Ensure the slot is on a valid working day for the seller.
            const dayOfWeek = slot.start.getDay();
            if (!workingHours.days.includes(dayOfWeek)) {
                return false;
            }

            // Rule 3: Check for overlaps with Google Calendar busy slots.
            return !busySlots.some(busy => {
                const busyStart = new Date(busy.start!);
                const busyEnd = new Date(busy.end!);
                return (slot.start < busyEnd && slot.end > busyStart);
            });
        });

        // Format the final slots into a user-friendly string for the buyer's timezone.
        const formattedSlots = availableSlots.map(slot => ({
            start: format(toZonedTime(slot.start, timezone), 'HH:mm'),
            end: format(toZonedTime(slot.end, timezone), 'HH:mm'),
        }));

        return NextResponse.json({ slots: formattedSlots });

    } catch (error: any) {
        console.error('Error fetching availability:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
