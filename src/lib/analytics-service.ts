/* eslint-disable @typescript-eslint/no-explicit-any */
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';


interface AggregationResult {
    _id: any;
    count: number;
}
// ----------------------

export class AnalyticsService {
    private db: any;

    constructor() {
        this.initialize();
    }

    private async initialize() {
        try {
            const client = await clientPromise;
            this.db = client.db(process.env.DATABASE_NAME);
        } catch (error) {
            console.error("Failed to connect to database for analytics:", error);
        }
    }

    async trackEvent(sellerId: string, eventType: 'booking_created' | 'booking_cancelled', metadata: any = {}) {
        if (!this.db) await this.initialize();
        try {
            await this.db.collection('analytics').insertOne({
                sellerId: new ObjectId(sellerId),
                eventType,
                metadata: {
                    ...metadata,
                    dayOfWeek: new Date().getDay(), // 0 = Sunday, 1 = Monday, etc.
                    hour: new Date().getHours(),   // 0-23
                },
                timestamp: new Date(),
            });
        } catch (error) {
            console.error('Analytics tracking error:', error);
        }
    }

    async getSellerAnalytics(sellerId: string) {
        if (!this.db) await this.initialize();

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const matchStage = {
            $match: {
                sellerId: new ObjectId(sellerId),
                timestamp: { $gte: sevenDaysAgo },
            },
        };

        const bookingTrendsPipeline = [
            matchStage,
            { $match: { eventType: 'booking_created' } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { '_id': 1 } },
        ];

        const popularTimeSlotsPipeline = [
            matchStage,
            { $match: { eventType: 'booking_created' } },
            {
                $group: {
                    _id: '$metadata.hour',
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
            { $limit: 10 },
        ];

        const [bookingTrends, popularTimeSlots] = await Promise.all([
            this.db.collection('analytics').aggregate(bookingTrendsPipeline).toArray(),
            this.db.collection('analytics').aggregate(popularTimeSlotsPipeline).toArray(),
        ]);

        // 2. Apply the type to the 'item' parameter in the map function
        const formattedTrends = bookingTrends.map((item: AggregationResult) => ({ date: item._id, bookings: item.count }));
        const formattedSlots = popularTimeSlots.map((item: AggregationResult) => ({ hour: `${item._id}:00`, bookings: item.count }));


        return {
            bookingTrends: formattedTrends,
            popularTimeSlots: formattedSlots,
        };
    }
}

