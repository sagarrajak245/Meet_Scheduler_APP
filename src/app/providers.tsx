"use client";

import { SessionProvider } from "next-auth/react";
import React from "react";

// This component is a "Client Component" (indicated by "use client").
// Its only job is to wrap our application with the SessionProvider from
// next-auth. This makes the user's session data (like their name and
// email) available to all client components in the app.
interface ProvidersProps {
    children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
    return <SessionProvider>{children}</SessionProvider>;
}

