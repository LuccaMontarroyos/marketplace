'use client';

import { AuthProvider } from "@/context/AuthContext";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

export function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            {children}
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
                toastStyle={{
                    backgroundColor: '#1E1E1E',
                    color: '#ffffff',
                    borderRadius: '10px',
                    fontFamily: 'Montserrat, sans-serif',
                }}
            />
        </AuthProvider>
    );
}