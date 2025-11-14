'use client';

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ToastContainer } from "react-toastify";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import 'react-toastify/dist/ReactToastify.css';

const publicRoutes = ["/login", "/cadastro", "/pedido"];

function AuthGuard({ children }: { children: React.ReactNode }) {
    const { usuario, token } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
  
    useEffect(() => {
      const checkAccess = async () => {
        const isPublic = publicRoutes.some(route => pathname.startsWith(route));
  
        if (isPublic) {
          setIsLoading(false);
          return;
        }
  
        if (usuario) {
          setIsLoading(false);
          return;
        }
  
        if (token && !usuario) {
          setIsLoading(true);
          return;
        }
  
        router.push("/login");
      };
  
      checkAccess();
    }, [usuario, token, pathname, router]);
  
    if (isLoading) return null;
  
    return <>{children}</>;
  }
  

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {/* <AuthGuard> */}
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
      {/* </AuthGuard> */}
    </AuthProvider>
  );
}
