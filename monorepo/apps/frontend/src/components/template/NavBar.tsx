"use client";
import CarrinhoItem from "./CarrinhoItem"
import NavBarItem from "./NavBarItem"
import { IconShoppingCart } from "@tabler/icons-react";
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from "@/context/AuthContext";
import { criarContaStripe, gerarLinkOnBoarding } from "@/services/stripe";
import { useEffect } from "react";
import { toast } from "react-toastify";

export default function NavBar({ onToggleCarrinho }: { onToggleCarrinho: () => void }) {
    const { token, logout } = useAuth();
    const router = useRouter();
    const { usuario } = useAuth();
    const pathname = usePathname();

    const usuarioLogado = !!token;

    const irParaCadastro = () => {
        const currentPath = window.location.pathname + window.location.search;
        console.log(currentPath);
        router.push(`/cadastro?from=${encodeURIComponent(currentPath)}`);
    };

    const irParaLogin = () => {
        const currentPath = window.location.pathname + window.location.search;
        console.log(currentPath);
        router.push(`/login?from=${encodeURIComponent(currentPath)}`);
    }

    const handleTornarVendedor = async () => {
        try {

            await criarContaStripe().catch((err) => {
                if (err.response?.data?.erro === "Usuário já possui conta no Stripe.") {
                    console.log("Conta Stripe já existe, seguimos...");
                } else {
                    throw err;
                }
            });


            const linkData = await gerarLinkOnBoarding();


            window.location.href = linkData.url;
        } catch (error) {
            console.error(error);
            alert("Erro ao tentar criar conta Stripe");
        }
    };

    useEffect(() => {
        if (pathname === "/stripe/onboarding/sucesso") {
            router.push("/cadastro/produto");
        } else if (pathname === "/stripe/onboarding/erro") {
            alert("Houve um problema no onboarding do Stripe. Tente novamente.");
            router.push("/perfil"); // ou outra página
        }
    }, [pathname]);

    return (
        <>
            {usuarioLogado ? (
                <nav className="flex items-center gap-4 md:gap-6 lg:gap-8 text-sm md:text-base">
                    {usuario?.isAdmin && (
                        <NavBarItem link={"/admin"} texto={"Admin"} />
                    )}
                    {usuario?.isVendedor && (
                        <NavBarItem link={"/cadastro/produto"} texto={"Cadastrar produto"} />
                    )}
                    <CarrinhoItem onClick={onToggleCarrinho} icone={IconShoppingCart} />
                    <NavBarItem link={"/perfil"} texto={"Perfil"} />
                    <NavBarItem
                        onClick={() => {
                            logout();
                            router.push("/login");
                            toast.success("Logout realizado com sucesso!");
                        }}
                        texto={"Sair"}
                    />
                </nav>
            ) : (
                <nav className="flex items-center gap-4 md:gap-6 lg:gap-8 text-sm md:text-base">
                    <CarrinhoItem onClick={onToggleCarrinho} icone={IconShoppingCart} />
                    <NavBarItem onClick={irParaLogin} texto={"Login"} />
                    <NavBarItem onClick={irParaCadastro} texto={"Cadastro"} />
                </nav>
            )}
        </>
    )
};
