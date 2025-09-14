"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, UserCheck } from 'lucide-react';
import { useState } from 'react';
// Correctly import the toast function from sonner
import { toast } from "sonner";

interface RoleSelectorProps {
    onRoleSelect: (role: 'seller' | 'buyer') => void;
    isLoading: boolean;
}

export function RoleSelector({ onRoleSelect, isLoading }: RoleSelectorProps) {
    const [selectedRole, setSelectedRole] = useState<'seller' | 'buyer' | null>(null);

    const handleSubmit = () => {
        if (selectedRole) {
            onRoleSelect(selectedRole);
        } else {
            // Use the new, simpler toast function
            toast.error("Selection Required", {
                description: "Please choose a role to continue.",
            });
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl">One Last Step!</CardTitle>
                <CardDescription>Choose your role to get started with the scheduler.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                    <Card
                        className={`cursor-pointer transition-all ${selectedRole === 'seller' ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'}`}
                        onClick={() => setSelectedRole('seller')}
                    >
                        <CardHeader className="text-center">
                            <UserCheck className="mx-auto h-12 w-12 text-blue-600" />
                            <CardTitle>Im a Seller</CardTitle>
                            <CardDescription className='text-slate-800'>
                                I want to offer my services and let people book appointments with me.
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Card
                        className={`cursor-pointer transition-all ${selectedRole === 'buyer' ? 'ring-2 ring-green-500 shadow-lg' : 'hover:shadow-md'}`}
                        onClick={() => setSelectedRole('buyer')}
                    >
                        <CardHeader className="text-center ">
                            <ShoppingCart className="mx-auto h-12 w-12 text-green-600" />
                            <CardTitle>Im a Buyer</CardTitle>
                            <CardDescription className='text-slate-800'>
                                I want to find services and book appointments with sellers.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>

                <div className="text-center mt-8">
                    <Button onClick={handleSubmit} size="lg" disabled={!selectedRole || isLoading}>
                        {isLoading ? "Saving..." : `Continue as a ${selectedRole ? selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1) : '...'}`}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

