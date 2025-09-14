import { Toaster } from "@/components/ui/sonner"; // For shadcn UI notifications
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css"; // Your global styles
import Providers from "./providers"; // Import the provider component you just created

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Scheduler App",
  description: "Smart scheduling made simple",
};

// This is the root layout for your entire application.  
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* We use the Providers component to wrap all the page content. */}
        {/* This is how the user's login status becomes available everywhere. */}
        <Providers>
          <main>{children}</main>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

