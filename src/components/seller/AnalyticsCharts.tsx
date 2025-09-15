"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, Line, LineChart, XAxis, YAxis } from "recharts";

interface AnalyticsChartsProps {
    analytics: {
        bookingTrends: { date: string; bookings: number }[];
        popularTimeSlots: { hour: string; bookings: number }[];
    } | null;
}

export function AnalyticsCharts({ analytics }: AnalyticsChartsProps) {
    if (!analytics) {
        return <div className="text-center p-10">Loading analytics data...</div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Booking Trends (Last 7 Days)</CardTitle>
                    <CardDescription>Daily booking volume over the past week.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{}} className="h-[250px] w-full">
                        <LineChart data={analytics.bookingTrends}>
                            <XAxis dataKey="date" />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Line type="monotone" dataKey="bookings" stroke="#8884d8" />
                        </LineChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Most Popular Booking Hours</CardTitle>
                    <CardDescription>Which hours of the day are booked most often.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{}} className="h-[250px] w-full">
                        <BarChart data={analytics.popularTimeSlots}>
                            <XAxis dataKey="hour" />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="bookings" fill="#82ca9d" radius={4} />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    );
}
