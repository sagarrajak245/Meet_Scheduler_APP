import 'next-auth';
import { DefaultSession } from 'next-auth';
import { JWT as DefaultJWT } from 'next-auth/jwt';

// Define the structure of the preferences object
interface UserPreferences {
    workingHours: {
        start: string;
        end: string;
        days: number[];
    };
    bufferTime: number;
    reminderPreferences: {
        email: boolean;
    };
}

declare module 'next-auth' {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: {
            id: string;
            role: 'seller' | 'buyer' | null;
            preferences?: UserPreferences; // Add the optional preferences object
        } & DefaultSession['user'];
    }

    interface User {
        role: 'seller' | 'buyer' | null;
        preferences?: UserPreferences; // Also add it to the base User type
    }
}

declare module 'next-auth/jwt' {
    /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
    interface JWT extends DefaultJWT {
        id: string;
        role: 'seller' | 'buyer' | null;
        preferences?: UserPreferences; // And finally to the JWT token
    }
}

// THIS IS THE NEW, CRITICAL PART TO FIX THE ADAPTER ERROR
declare module "next-auth/adapters" {
    interface AdapterUser {
        role?: 'seller' | 'buyer' | null;
        preferences?: UserPreferences;
    }
}

