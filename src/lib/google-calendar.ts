
import { google } from 'googleapis';
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

        // The refresh token from NextAuth is already a string and doesn't need decryption
        // unless you explicitly encrypted it upon saving. For simplicity, we assume it's not encrypted yet.
        // If you plan to encrypt, you'd save an encrypted version and decrypt here.
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

    // Note: createEvent logic will be used later when a buyer books an appointment
}
