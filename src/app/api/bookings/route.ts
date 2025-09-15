/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleCalendarService } from '@/lib/google-calendar';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '../auth/[...nextauth]/route';

// GET handler to fetch bookings for the current user
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const client = await clientPromise;
        const db = client.db(process.env.DATABASE_NAME);
        const userId = new ObjectId(session.user.id);
        const userRole = session.user.role;

        // Build the query based on the user's role
        const query = userRole === 'seller' ? { sellerId: userId } : { buyerId: userId };

        // Find all bookings and join with the other user's data
        const bookings = await db.collection("bookings").aggregate([
            { $match: query },
            {
                $lookup: {
                    from: "users",
                    localField: userRole === 'seller' ? "buyerId" : "sellerId",
                    foreignField: "_id",
                    as: "otherUser"
                }
            },
            { $unwind: "$otherUser" },
            {
                $project: { // Only return necessary fields
                    startTime: 1,
                    endTime: 1,
                    title: 1,
                    status: 1,
                    googleMeetLink: 1,
                    "otherUser.name": 1,
                    "otherUser.email": 1,
                    "otherUser.image": 1,
                }
            },
            { $sort: { startTime: -1 } } // Sort by most recent first
        ]).toArray();

        return NextResponse.json(bookings);
    } catch (error) {
        console.error("Error fetching bookings:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST handler to create a new booking (already built)
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();
        const { sellerId, startTime, endTime, timezone, title, description } = body;

        if (!sellerId || !startTime || !endTime || !title) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(process.env.DATABASE_NAME);

        const seller = await db.collection("users").findOne({ _id: new ObjectId(sellerId) });
        const buyer = await db.collection("users").findOne({ _id: new ObjectId(session.user.id) });

        if (!seller || !buyer) {
            return NextResponse.json({ error: 'Invalid user or seller' }, { status: 404 });
        }

        const calendarService = new GoogleCalendarService();
        await calendarService.setCredentialsForUser(sellerId);

        const eventDetails = {
            title,
            description: description || 'Scheduling meeting via Scheduler App',
            startTime,
            endTime,
            timezone,
            attendees: [{ email: seller.email }, { email: buyer.email }],
        };

        const calendarEvent = await calendarService.createEvent(eventDetails);

        if (!calendarEvent) {
            throw new Error("Failed to create Google Calendar event.");
        }

        const newBooking = {
            sellerId: new ObjectId(sellerId),
            buyerId: new ObjectId(session.user.id),
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            timezone,
            title,
            description,
            googleMeetLink: calendarEvent.hangoutLink,
            calendarEventId: calendarEvent.id,
            status: 'confirmed',
            remindersSent: {},
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection("bookings").insertOne(newBooking);

        return NextResponse.json({ success: true, bookingId: result.insertedId, event: calendarEvent });

    } catch (error: any) {
        console.error('Error creating booking:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

