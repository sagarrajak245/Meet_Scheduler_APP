import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ sellerId: string }> }) {
    try {
        // Await params before destructuring
        const { sellerId } = await params;

        if (!ObjectId.isValid(sellerId)) {
            return NextResponse.json({ error: 'Invalid Seller ID format' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(process.env.DATABASE_NAME);

        const seller = await db.collection("users").findOne({ _id: new ObjectId(sellerId) });

        if (!seller || seller.role !== 'seller') {
            return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
        }

        // Return public-safe information that the booking page needs
        const safeSeller = {
            _id: seller._id,
            name: seller.name,
            email: seller.email,
            image: seller.image,
        };

        return NextResponse.json(safeSeller);
    } catch (error) {
        // Since we now await params, we need to handle the awaited sellerId
        const awaitedParams = await params;
        console.error(`Error fetching seller ${awaitedParams.sellerId}:`, error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}