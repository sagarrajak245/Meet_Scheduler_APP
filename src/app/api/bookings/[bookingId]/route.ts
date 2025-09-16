import { AnalyticsService } from '@/lib/analytics-service';
import { authOptions } from '@/lib/auth';
import { EmailService } from '@/lib/email-service';
import { GoogleCalendarService } from '@/lib/google-calendar';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// --- THIS IS THE FIX ---
// 1. Define the shape of the documents we're fetching for type safety
interface BookingDocument {
    _id: ObjectId;
    sellerId: ObjectId;
    buyerId: ObjectId;
    startTime: Date;
    endTime: Date;
    title: string;
    calendarEventId: string;
    // ... add other booking fields as needed
}

interface UserDocument {
    _id: ObjectId;
    name: string;
    email: string;
}
// ----------------------

// This is the DELETE handler for cancelling a booking
export async function DELETE(request: NextRequest, context: { params: Promise<{ bookingId: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const params = await context.params; // Await the params
        const { bookingId } = params;

        const client = await clientPromise;
        const db = client.db(process.env.DATABASE_NAME);
        const bookingsCollection = db.collection<BookingDocument>('bookings'); // 2. Apply the type here

        if (!ObjectId.isValid(bookingId)) {
            return NextResponse.json({ error: 'Invalid booking ID' }, { status: 400 });
        }

        const booking = await bookingsCollection.findOne({ _id: new ObjectId(bookingId) });
        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        const isUserInvolved = session.user.id === booking.sellerId.toString() || session.user.id === booking.buyerId.toString();
        if (!isUserInvolved) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await bookingsCollection.updateOne(
            { _id: new ObjectId(bookingId) },
            { $set: { status: 'cancelled', updatedAt: new Date() } }
        );

        const calendarService = new GoogleCalendarService();
        await calendarService.setCredentialsForUser(booking.sellerId.toString());
        await calendarService.cancelEvent(booking.calendarEventId);

        const usersCollection = db.collection<UserDocument>('users'); // Also apply type here for safety
        const seller = await usersCollection.findOne({ _id: booking.sellerId });
        const buyer = await usersCollection.findOne({ _id: booking.buyerId });

        if (seller && buyer) {
            const emailService = new EmailService();
            // 3. Now TypeScript knows `booking`, `seller`, and `buyer` are correctly shaped
            await emailService.sendBookingCancellation(booking, seller, buyer, session.user.role as 'seller' | 'buyer');
        }

        const analyticsService = new AnalyticsService();
        await analyticsService.trackEvent(booking.sellerId.toString(), 'booking_cancelled');

        return NextResponse.json({ success: true, message: 'Booking successfully cancelled.' });
    } catch (error) {
        console.error('Error cancelling booking:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 