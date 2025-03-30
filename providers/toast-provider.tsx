"use client"

import { Toaster } from 'react-hot-toast';

export const ToastProvider = () => {
    return (
        <Toaster
            position="bottom-right"
            reverseOrder={false}
            gutter={8}
            toastOptions={{
                duration: 5000,
                style: {
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    border: '1px solid hsl(var(--border))',
                },
                success: {
                    style: {
                        borderLeft: '4px solid hsl(var(--success))',
                    },
                },
                error: {
                    style: {
                        borderLeft: '4px solid hsl(var(--destructive))',
                    },
                },
            }}
        />
    );
};