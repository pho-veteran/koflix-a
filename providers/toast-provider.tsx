"use client"

import { Toaster } from 'react-hot-toast';
import { CheckCircle2, XCircle } from 'lucide-react';

export const ToastProvider = () => {
    return (
        <Toaster
            position="bottom-right"
            reverseOrder={false}
            gutter={8}
            toastOptions={{
                duration: 5000,
                style: {
                    color: '#1a1a1a',
                    borderRadius: '6px',
                    padding: '12px 16px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                },
                success: {
                    style: {
                        background: 'rgba(234, 250, 241, 0.95)',
                        border: '1px solid rgba(72, 187, 120, 0.3)',
                        borderLeft: '4px solid #2ecc71',
                        borderLeftColor: '#2ecc71',
                    },
                    icon: <CheckCircle2 size={18} color="#2ecc71" />,
                },
                error: {
                    style: {
                        background: 'rgba(254, 236, 234, 0.95)',
                        border: '1px solid rgba(245, 101, 101, 0.3)',
                        borderLeft: '4px solid #e74c3c',
                        borderLeftColor: '#e74c3c',
                    },
                    icon: <XCircle size={18} color="#e74c3c" />,
                },
            }}
        />
    );
};