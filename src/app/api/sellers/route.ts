import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.DATABASE_NAME);

        // Find all users with the role 'seller'
        const sellers = await db.collection("users").find({ role: 'seller' }).toArray();

        // Only return public-safe information
        const safeSellers = sellers.map(seller => ({
            _id: seller._id,
            name: seller.name,
            email: seller.email,
            image: seller.image,
            preferences: seller.preferences // We can send preferences as they are not secret
        }));

        return NextResponse.json(safeSellers);
    } catch (error) {
        console.error('Error fetching sellers:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
