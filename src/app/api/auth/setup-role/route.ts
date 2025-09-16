import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";

export async function POST(request: Request) {
    // 1. Authenticate the user
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const { role } = await request.json();

        // 2. Validate the input
        if (role !== 'seller' && role !== 'buyer') {
            return new Response(JSON.stringify({ error: "Invalid role specified" }), { status: 400 });
        }

        // 3. Update the user in the database
        const client = await clientPromise;
        const db = client.db(process.env.DATABASE_NAME);
        const usersCollection = db.collection("users");

        const result = await usersCollection.updateOne(
            { _id: new ObjectId(session.user.id) },
            { $set: { role: role } }
        );

        if (result.modifiedCount === 0) {
            // This might happen if the user already has a role or the user ID is not found
            const user = await usersCollection.findOne({ _id: new ObjectId(session.user.id) });
            if (user?.role) {
                return new Response(JSON.stringify({ message: "Role already set." }), { status: 200 });
            }
            return new Response(JSON.stringify({ error: "User not found or role could not be updated." }), { status: 404 });
        }

        // 4. Return a success response
        return new Response(JSON.stringify({ message: "Role updated successfully" }), { status: 200 });

    } catch (error) {
        console.error("Error setting up role:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }
}
