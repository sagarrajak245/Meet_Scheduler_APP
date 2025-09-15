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
    // Add a new optional prop to receive the cancellation handler function
    onCancel?: (bookingId: string) => void;
}

export function BookingCard({ booking, onCancel }: BookingCardProps) {
    const isPast = new Date(booking.startTime) < new Date();
    // A booking is "upcoming" if it's not in the past and is still confirmed
    const isUpcoming = !isPast && booking.status === 'confirmed';

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>{booking.title}</CardTitle>
                    <CardDescription>with {booking.otherUser.name}</CardDescription>
                </div>
                {/* Updated badge logic to show different colors for different statuses */}
                <Badge variant={booking.status !== 'confirmed' ? 'destructive' : isPast ? 'secondary' : 'default'}>
                    {booking.status}
                </Badge>
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
                <div className="flex items-center text-sm text-slate-700">
                    <User className="mr-2 h-4 w-4" />
                    <Avatar className="h-6 w-6 mr-2 ">
                        <AvatarImage src={booking.otherUser.image} />
                        <AvatarFallback>{booking.otherUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{booking.otherUser.name} ({booking.otherUser.email})</span>
                </div>
                {booking.googleMeetLink && (
                    <Button asChild variant="outline" className="w-full text-slate-800">
                        <a href={booking.googleMeetLink} target="_blank" rel="noopener noreferrer">
                            <Video className="mr-2 h-4 w-4 text-cyan-500" />
                            Join Google Meet
                        </a>
                    </Button>
                )}


                {/* Conditionally render the cancel button if the booking is upcoming and the onCancel function is provided */}
                {isUpcoming && onCancel && (
                    <div className="pt-3 border-t mt-3">
                        <Button
                            variant="destructive"
                            size="sm"
                            className="w-full"
                            onClick={() => onCancel(booking._id)}
                        >
                            Cancel Appointment
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

