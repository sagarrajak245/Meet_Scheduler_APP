import { AnalyticsService } from "@/lib/analytics-service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ sellerId: string }> }) {
    try {
        const { sellerId } = await params;
        const analyticsService = new AnalyticsService();
        const data = await analyticsService.getSellerAnalytics(sellerId);
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching seller analytics:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}  