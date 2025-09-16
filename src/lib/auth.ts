
// src/lib/auth.ts
import clientPromise from '@/lib/mongodb';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import { ObjectId } from 'mongodb';
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
    adapter: MongoDBAdapter(clientPromise),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    scope: [
                        'openid',
                        'email',
                        'profile',
                        'https://www.googleapis.com/auth/calendar.events',
                        'https://www.googleapis.com/auth/calendar.readonly'
                    ].join(' '),
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        }),
    ],
    session: {
        strategy: 'jwt', // Using JWT strategy is essential for this robust callback flow
    },
    callbacks: {
        // This callback is called whenever a JWT is created or updated.
        async jwt({ token, user, trigger, session }) {
            // On initial sign-in, add the user ID to the token
            if (user) {
                token.id = user.id;
            }
            // If the session was updated (e.g., by our role selection),
            // we can pass the new role directly to the token.
            if (trigger === "update" && session?.user?.role) {
                token.role = session.user.role;
            }
            // **THIS IS THE CRITICAL PART**
            // On every JWT check (e.g., page navigation), re-fetch the role from the DB
            // This ensures the session is always in sync with the database.
            if (token.id) {
                const client = await clientPromise;
                const db = client.db(process.env.DATABASE_NAME);
                const dbUser = await db.collection("users").findOne({ _id: new ObjectId(token.id as string) });
                if (dbUser) {
                    token.role = dbUser.role; // Add role from DB to the token
                }
            }
            return token;
        },
        // This callback is called whenever a session is checked on the client.
        async session({ session, token }) {
            // Pass the custom properties from the token to the client-side session object
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as 'seller' | 'buyer' | null;
            }
            return session;
        },
    },
    pages: {
        signIn: '/', // Send users to the homepage to start the login/triage flow
    },
};  