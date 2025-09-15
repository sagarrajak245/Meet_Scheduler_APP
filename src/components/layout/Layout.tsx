"use client";

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar, LayoutDashboard, LogOut } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface LayoutProps {
    children: React.ReactNode;
}

export function MainLayout({ children }: LayoutProps) {
    const { data: session } = useSession();
    const router = useRouter();

    if (!session) {
        // Or a loading spinner
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    const dashboardHref = session.user.role === 'seller' ? '/dashboard/seller' : '/dashboard/buyer';

    const navigation = [
        { name: 'Dashboard', href: dashboardHref, icon: LayoutDashboard },
        { name: 'My Appointments', href: '/appointments', icon: Calendar },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation Header */}
            <header className="bg-cyan-200 shadow-sm border-b sticky top-0 z-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-8">
                            <Link href="/" className="text-xl font-bold text-gray-800">
                                Scheduler
                            </Link>
                            <nav className="hidden md:flex space-x-4">
                                {navigation.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Button
                                            key={item.name}
                                            variant="ghost"
                                            onClick={() => router.push(item.href)}
                                        >
                                            <Icon className="h-4 w-4 mr-2" />
                                            {item.name}
                                        </Button>
                                    );
                                })}
                            </nav>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={session.user.image ?? undefined} />
                                    <AvatarFallback>{session.user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium text-gray-700 hidden sm:block">{session.user.name}</span>
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full capitalize">
                                    {session.user.role}
                                </span>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: '/' })}>
                                <LogOut className="h-4 w-4 mr-2" />
                                Sign Out
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="py-8">
                {children}
            </main>
        </div>
    );
}
