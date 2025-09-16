import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function PUT(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    try {
        const { preferences } = await request.json();

        const client = await clientPromise;
        const db = client.db(process.env.DATABASE_NAME);

        const result = await db.collection("users").updateOne(
            { _id: new ObjectId(session.user.id) },
            { $set: { preferences: preferences } }
        );

        if (result.modifiedCount === 0 && result.upsertedCount === 0) {

            // This might happen if the user document doesn't exist, which is unlikely but possible
            return NextResponse.json({ error: "User not found or preferences not updated" }, { status: 404 });

        }

        return NextResponse.json({ message: "Preferences updated successfully" }, { status: 200 });

    } catch (error) {
        console.error("Failed to update preferences:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
