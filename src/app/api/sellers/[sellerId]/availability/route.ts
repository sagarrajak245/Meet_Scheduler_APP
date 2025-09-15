/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleCalendarService } from '@/lib/google-calendar';
import clientPromise from '@/lib/mongodb';
import { add, format, parse } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ sellerId: string }> }) {
    try {
        // Await params before destructuring
        const { sellerId } = await params;
        const searchParams = request.nextUrl.searchParams;
        const date = searchParams.get('date');
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
        const potentialSlots = [];

        const startOfDayInTimezone = fromZonedTime(`${date}T00:00:00`, timezone);
        const endOfDayInTimezone = fromZonedTime(`${date}T23:59:59`, timezone);

        const sellerStartTime = parse(workingHours.start, 'HH:mm', startOfDayInTimezone);
        const sellerEndTime = parse(workingHours.end, 'HH:mm', startOfDayInTimezone);

        let currentSlot = sellerStartTime;
        while (currentSlot < sellerEndTime) {
            const slotEnd = add(currentSlot, { minutes: meetingDuration });
            if (slotEnd > sellerEndTime) break;

            potentialSlots.push({ start: currentSlot, end: slotEnd });
            currentSlot = add(currentSlot, { minutes: meetingDuration + bufferTime });
        }

        const calendarService = new GoogleCalendarService();
        await calendarService.setCredentialsForUser(sellerId);

        const busySlots = await calendarService.getFreeBusy(
            startOfDayInTimezone.toISOString(),
            endOfDayInTimezone.toISOString(),
            timezone
        );

        const availableSlots = potentialSlots.filter(slot => {
            const dayOfWeek = slot.start.getDay();
            if (!workingHours.days.includes(dayOfWeek)) {
                return false;
            }

            return !busySlots.some(busy => {
                const busyStart = new Date(busy.start!);
                const busyEnd = new Date(busy.end!);
                return (slot.start < busyEnd && slot.end > busyStart);
            });
        });

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