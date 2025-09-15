"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Calendar, Clock, User, Video } from "lucide-react";

// Define a type for the booking object for clarity
interface Booking {
    _id: string;
    startTime: string;
    endTime: string;
    title: string;
    status: 'confirmed' | 'cancelled' | 'completed';
    googleMeetLink?: string;
    otherUser: {
        name: string;
        email: string;
        image: string;
    }
}

interface BookingCardProps {
    booking: Booking;
}

export function BookingCard({ booking }: BookingCardProps) {
    const isPast = new Date(booking.startTime) < new Date();

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>{booking.title}</CardTitle>
                    <CardDescription>with {booking.otherUser.name}</CardDescription>
                </div>
                <Badge variant={isPast ? "secondary" : "default"}>{booking.status}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>{format(new Date(booking.startTime), 'EEEE, MMMM dd, yyyy')}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="mr-2 h-4 w-4" />
                    <span>{format(new Date(booking.startTime), 'p')} - {format(new Date(booking.endTime), 'p')}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                    <User className="mr-2 h-4 w-4" />
                    <Avatar className="h-6 w-6 mr-2">
                        <AvatarImage src={booking.otherUser.image} />
                        <AvatarFallback>{booking.otherUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{booking.otherUser.name} ({booking.otherUser.email})</span>
                </div>
                {booking.googleMeetLink && (
                    <Button asChild variant="outline" className="w-full">
                        <a href={booking.googleMeetLink} target="_blank" rel="noopener noreferrer">
                            <Video className="mr-2 h-4 w-4" />
                            Join Google Meet
                        </a>
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
