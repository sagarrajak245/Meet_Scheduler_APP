"use client";

import { RoleSelector } from '@/components/auth/RoleSelector';
import { SignInButton } from '@/components/auth/SignInButton';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Calendar, Clock, LogOut, Video } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Home() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isLoadingRole, setIsLoadingRole] = useState(false);

  // This effect handles redirection for users who ALREADY have a role
  useEffect(() => {
    if (status === 'authenticated' && session.user.role) {
      const dashboardUrl = session.user.role === 'seller' ? '/dashboard/seller' : '/dashboard/buyer';
      router.push(dashboardUrl);
    }
  }, [session, status, router]);

  const handleRoleSelect = async (role: 'seller' | 'buyer') => {
    setIsLoadingRole(true);
    try {
      const response = await fetch('/api/auth/setup-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      if (response.ok) {
        // Optimistically update the session to trigger the useEffect redirect
        await update({ ...session, user: { ...session?.user, role: role } });
      } else {
        console.error('Failed to set role');
        // Optionally show a toast error here
      }
    } catch (error) {
      console.error('Error setting role:', error);
    } finally {
      setIsLoadingRole(false);
    }
  };

  // 1. Show a loading state while session is being checked
  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;
  }

  // 2. If user is authenticated BUT has NO role, show the RoleSelector
  if (status === 'authenticated' && !session.user.role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-100 to-cyan-200 p-4">
        <div>
          <div className="text-center mb-4 bg-white/70 backdrop-blur-sm p-3 rounded-lg shadow">
            <p className="mb-2 text-slate-700">Signed in as {session.user.email}</p>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out & start over
            </Button>
          </div>
          <RoleSelector onRoleSelect={handleRoleSelect} isLoading={isLoadingRole} />
        </div>
      </div>
    );
  }

  // 3. If user is NOT authenticated, show the main landing page
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-100 to-cyan-200">
        <div className="container mx-auto px-6 py-12">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Smart Scheduling Made Simple
            </h1>
            <p className="text-lg md:text-xl text-slate-700 mb-8 max-w-3xl mx-auto">
              Connect with service providers, book appointments seamlessly, and never miss a meeting
              with automated reminders and Google Calendar integration.
            </p>
            <div className="flex justify-center">
              <SignInButton />
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Calendar className="mx-auto h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>Google Calendar Sync</CardTitle>
                <CardDescription>
                  Seamless integration with your Google Calendar for automatic scheduling.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Video className="mx-auto h-12 w-12 text-green-600 mb-4" />
                <CardTitle>Google Meet Integration</CardTitle>
                <CardDescription>
                  Automatic video meeting links for all your appointments.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Clock className="mx-auto h-12 w-12 text-orange-600 mb-4" />
                <CardTitle>Smart Reminders</CardTitle>
                <CardDescription>
                  Never miss an appointment with automated email reminders.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <BarChart3 className="mx-auto h-12 w-12 text-purple-600 mb-4" />
                <CardTitle>Booking Analytics</CardTitle>
                <CardDescription>
                  Insights into your booking patterns and popular time slots.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-white rounded-lg shadow-xl p-12">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-slate-700 mb-8">
              Join thousands of professionals who trust our platform for their scheduling needs.
            </p>
            <SignInButton />
          </div>
        </div>
      </div>
    );
  }

  // 4. Fallback for authenticated users WITH a role while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting to your dashboard...</p>
    </div>
  );
}

