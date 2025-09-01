"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function StripeRedirectHandler() {
    const router = useRouter();
    const pathname = usePathname();


    useEffect(() => {
        if (pathname.startsWith("/stripe/onboarding/sucesso")) {
            router.replace("/cadastro/produto"); // redireciona
        } else if (pathname.startsWith("/stripe/onboarding/erro")) {
            alert("Houve um problema no onboarding do Stripe. Tente novamente.");
            router.replace("/perfil"); // redireciona para página segura
        }
    }, [pathname]);

    return null; // não renderiza nada
}
