"use client";

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Clock, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Define a type for the seller object for better type safety    
type Seller = {
    _id: string;
    name: string;
    email: string;
    image: string;
    preferences?: {
        workingHours: {
            start: string;
            end: string;
        }
    }
};

export function BuyerDashboard() {
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const router = useRouter();

    useEffect(() => {
        const fetchSellers = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/sellers');
                const data = await response.json();
                setSellers(data);
            } catch (error) {
                console.error('Failed to fetch sellers', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSellers();
    }, []);

    const filteredSellers = sellers.filter(seller =>
        seller.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="text-center p-10">Loading sellers...</div>;
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Find a Service Provider</h1>
                <p className="text-muted-foreground">Browse and book appointments with our top-rated professionals.</p>
                <div className="relative max-w-md mt-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                        placeholder="Search by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {filteredSellers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSellers.map((seller) => (
                        <Card key={seller._id} className="hover:shadow-lg transition-shadow duration-300">
                            <CardHeader className="flex flex-row items-center gap-4">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={seller.image} alt={seller.name} />
                                    <AvatarFallback>{seller.name.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle>{seller.name}</CardTitle>
                                    <CardDescription>{seller.email}</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="flex flex-col justify-between">
                                {seller.preferences?.workingHours && (
                                    <div className="flex items-center text-sm text-muted-foreground mb-4">
                                        <Clock className="mr-2 h-4 w-4" />
                                        <span>
                                            Available from {seller.preferences.workingHours.start} to {seller.preferences.workingHours.end}
                                        </span>
                                    </div>
                                )}
                                <Button className="w-full" onClick={() => router.push(`/book/${seller._id}`)}>
                                    View Availability
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <p className="text-lg text-muted-foreground">No sellers found matching your search.</p>
                </div>
            )}
        </div>
    );
}
