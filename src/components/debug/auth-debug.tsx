'use client';

import { useAuth } from '@/components/providers/local-auth-provider';

export function AuthDebug() {
    const { isAuthenticated, isLoading, user } = useAuth();

    return (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded text-xs font-mono max-w-sm">
            <h3 className="font-bold mb-2">Auth Debug</h3>
            <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
            <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
            <div>User: {user ? user.email : 'None'}</div>
            <div>Role: {user?.role || 'None'}</div>
            <div className="mt-2 text-green-400">
                ENV Check:
            </div>
            <div>JWT Secret: {process.env.JWT_SECRET ? 'Set' : 'Missing'}</div>
            <div>API URL: {process.env.NEXT_PUBLIC_API_URL ? 'Set' : 'Missing'}</div>
        </div>
    );
}
