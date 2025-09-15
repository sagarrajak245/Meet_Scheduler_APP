/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { toast } from "sonner";

// Define the structure of preferences for clarity
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

export function AvailabilityEditor() {
    const { data: session, update } = useSession();
    const [loading, setLoading] = useState(false);
    const [preferences, setPreferences] = useState<UserPreferences>({
        workingHours: {
            start: '09:00',
            end: '17:00',
            days: [1, 2, 3, 4, 5], // Mon-Fri default
        },
        bufferTime: 15,
        reminderPreferences: {
            email: true,
        },
    });

    // Fetch existing preferences when the component loads
    useEffect(() => {
        if (session?.user?.preferences) {
            setPreferences(session.user.preferences as UserPreferences);
        }
    }, [session]);


    const daysOfWeek = [
        { id: 1, name: 'Monday' },
        { id: 2, name: 'Tuesday' },
        { id: 3, name: 'Wednesday' },
        { id: 4, name: 'Thursday' },
        { id: 5, name: 'Friday' },
        { id: 6, name: 'Saturday' },
        { id: 0, name: 'Sunday' },
    ];

    const handleDayToggle = (dayId: number) => {
        const currentDays = preferences.workingHours.days;
        const newDays = currentDays.includes(dayId)
            ? currentDays.filter(d => d !== dayId)
            : [...currentDays, dayId].sort();
        setPreferences(prev => ({
            ...prev,
            workingHours: { ...prev.workingHours, days: newDays },
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/users/preferences', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ preferences }),
            });

            if (!response.ok) throw new Error('Failed to save preferences');

            // Optimistically update the session with new preferences
            await update({ ...session, user: { ...session?.user, preferences } });

            // Use the new sonner toast syntax
            toast.success("Preferences Saved!", {
                description: "Your availability settings have been updated.",
            });

        } catch (error) {
            // Use the new sonner toast syntax for errors
            toast.error("Save Failed", {
                description: "Could not save preferences. Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Working Hours</CardTitle>
                    <CardDescription>Set the days and hours you are available for bookings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="start-time">Start Time</Label>
                            <Input
                                id="start-time"
                                type="time"
                                value={preferences.workingHours.start}
                                onChange={(e) => setPreferences(p => ({ ...p, workingHours: { ...p.workingHours, start: e.target.value } }))}
                            />
                        </div>
                        <div>
                            <Label htmlFor="end-time">End Time</Label>
                            <Input
                                id="end-time"
                                type="time"
                                value={preferences.workingHours.end}
                                onChange={(e) => setPreferences(p => ({ ...p, workingHours: { ...p.workingHours, end: e.target.value } }))}
                            />
                        </div>
                    </div>
                    <div>
                        <Label>Working Days</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {daysOfWeek.map(day => (
                                <Button
                                    key={day.id}
                                    variant={preferences.workingHours.days.includes(day.id) ? 'default' : 'outline'}
                                    onClick={() => handleDayToggle(day.id)}
                                >
                                    {day.name}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Booking Settings</CardTitle>
                    <CardDescription>Configure buffer times and reminders.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="buffer-time">Buffer Time (minutes)</Label>
                        <Input
                            id="buffer-time"
                            type="number"
                            min="0"
                            value={preferences.bufferTime}
                            onChange={(e) => setPreferences(p => ({ ...p, bufferTime: parseInt(e.target.value, 10) || 0 }))}
                            className="w-48"
                        />
                        <p className="text-sm text-muted-foreground mt-1">Time to leave free between appointments.</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="email-reminders"
                            checked={preferences.reminderPreferences.email}
                            onCheckedChange={(checked) => setPreferences(p => ({ ...p, reminderPreferences: { ...p.reminderPreferences, email: checked } }))}
                        />
                        <Label htmlFor="email-reminders">Enable Email Reminders</Label>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={loading}>
                    {loading ? "Saving..." : "Save Preferences"}
                </Button>
            </div>
        </div>
    );
}

