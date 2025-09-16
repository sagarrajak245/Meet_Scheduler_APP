import { EmailService } from '@/lib/email-service';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';

// Define the shape of the data we expect from our database query
interface MailUser {
    _id: ObjectId;
    name: string;
    email: string;
}

interface BookingWithUsers {
    _id: ObjectId;
    startTime: Date;
    endTime: Date;
    title: string;
    description?: string;
    googleMeetLink?: string | null;
    seller: MailUser;
    buyer: MailUser;
}

// This is the GET handler that Vercel Cron Jobs will call
export async function GET(request: NextRequest) {
    // 1. Secure the endpoint
    const authHeader = request.headers.get('authorization');
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const client = await clientPromise;
        const db = client.db(process.env.DATABASE_NAME);
        const emailService = new EmailService();
        const now = new Date();

        const reminderWindows = [
            { minutes: 60, field: 'remindersSent.60' },
            { minutes: 30, field: 'remindersSent.30' },
        ];

        let totalRemindersSent = 0;

        for (const window of reminderWindows) {
            // Find bookings within the reminder window that haven't had this reminder sent
            const gte = new Date(now.getTime() + (window.minutes - 5) * 60 * 1000); // e.g., 55 mins from now
            const lte = new Date(now.getTime() + (window.minutes + 5) * 60 * 1000); // e.g., 65 mins from now

            const bookingsToRemind = await db.collection("bookings").aggregate<BookingWithUsers>([
                {
                    $match: {
                        startTime: { $gte: gte, $lte: lte },
                        status: 'confirmed',
                        [window.field]: { $ne: true }
                    }
                },
                { $lookup: { from: 'users', localField: 'sellerId', foreignField: '_id', as: 'seller' } },
                { $lookup: { from: 'users', localField: 'buyerId', foreignField: '_id', as: 'buyer' } },
                { $unwind: '$seller' },
                { $unwind: '$buyer' }
            ]).toArray();

            for (const booking of bookingsToRemind) {
                const bookingForEmail = {
                    ...booking,
                    _id: booking._id.toString(),
                };
                // ----------------------

                await emailService.sendReminder(bookingForEmail, booking.buyer, window.minutes);
                await emailService.sendReminder(bookingForEmail, booking.seller, window.minutes);

                // Mark the reminder as sent in the database
                await db.collection("bookings").updateOne(
                    { _id: booking._id },
                    { $set: { [window.field]: true, updatedAt: new Date() } }
                );
                totalRemindersSent += 2; // one for buyer, one for seller
            }
        }

        return NextResponse.json({
            message: 'Reminder check complete.',
            remindersSent: totalRemindersSent,
        });

    } catch (error) {
        console.error('Cron job error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

