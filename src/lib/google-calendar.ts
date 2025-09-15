/* eslint-disable @typescript-eslint/no-explicit-any */
import { calendar_v3, google } from 'googleapis'; // Import calendar_v3 for strong types
import { ObjectId } from 'mongodb';
import clientPromise from './mongodb';

export class GoogleCalendarService {
    private oauth2Client;

    constructor() {
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.NEXTAUTH_URL + '/api/auth/callback/google'
        );
    }

    // Set the credentials for a specific user by fetching their refresh token
    async setCredentialsForUser(userId: string) {
        const client = await clientPromise;
        const db = client.db(process.env.DATABASE_NAME);
        const account = await db.collection("accounts").findOne({ userId: new ObjectId(userId) });

        if (!account || !account.refresh_token) {
            throw new Error("User's Google account not linked or refresh token is missing.");
        }

        this.oauth2Client.setCredentials({
            refresh_token: account.refresh_token,
        });
    }

    // Get the user's busy time slots from their primary calendar
    async getFreeBusy(timeMin: string, timeMax: string, timeZone: string) {
        const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

        const response = await calendar.freebusy.query({
            requestBody: {
                timeMin,
                timeMax,
                timeZone,
                items: [{ id: 'primary' }], // 'primary' refers to the user's main calendar
            },
        });

        return response.data.calendars?.primary?.busy || [];
    }

    // --- NEW METHOD ADDED BELOW ---

    /**
     * Creates a new event in the user's primary Google Calendar.
     * @param eventDetails Details of the event to be created.
     * @returns The data of the created calendar event.
     */
    async createEvent(eventDetails: {
        title: string;
        description?: string;
        startTime: string; // ISO 8601 format
        endTime: string;   // ISO 8601 format
        timezone: string;
        attendees: { email: string }[];
    }) {
        const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

        // Construct the event object with strong types from the library
        const event: calendar_v3.Params$Resource$Events$Insert["requestBody"] = {
            summary: eventDetails.title,
            description: eventDetails.description,
            start: {
                dateTime: eventDetails.startTime,
                timeZone: eventDetails.timezone,
            },
            end: {
                dateTime: eventDetails.endTime,
                timeZone: eventDetails.timezone,
            },
            attendees: eventDetails.attendees,
            // This block is crucial for generating a Google Meet link
            conferenceData: {
                createRequest: {
                    requestId: `meet-${Date.now()}`, // A unique ID for the request
                    conferenceSolutionKey: { type: 'hangoutsMeet' },
                },
            },
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 60 },
                    { method: 'popup', minutes: 10 },
                ],
            },
        };

        const response = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: event,
            conferenceDataVersion: 1, // Required to get a Meet link
            sendUpdates: 'all',       // Ensures guests receive an invitation email
        });

        return response.data;
    }


    // --- THIS IS THE NEW METHOD ---
    /**
     * Cancels an event in the user's primary Google Calendar.
     * @param eventId The ID of the Google Calendar event to cancel.
     */
    async cancelEvent(eventId: string) {
        const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

        try {
            await calendar.events.delete({
                calendarId: 'primary',
                eventId: eventId,
                sendUpdates: 'all', // This is crucial to notify guests of the cancellation
            });
            console.log(`Successfully cancelled event: ${eventId}`);
            return true;
        } catch (error: any) {
            // It's common for an event to have already been deleted by the user in their calendar.
            // Google returns a 410 "Gone" error in this case, which we can safely ignore.
            if (error.code === 410) {
                console.log(`Event ${eventId} was already gone. Proceeding.`);
                return true;
            }
            // For other errors, we should log them.
            console.error(`Failed to cancel event ${eventId}:`, error);
            throw new Error('Failed to update Google Calendar event.');
        }
    }
}

