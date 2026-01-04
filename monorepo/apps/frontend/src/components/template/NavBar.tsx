"use client";
import CarrinhoItem from "./CarrinhoItem"
import NavBarItem from "./NavBarItem"
import { IconShoppingCart } from "@tabler/icons-react";
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";

export default function NavBar({ onToggleCarrinho }: { onToggleCarrinho: () => void }) {
    const { token, logout } = useAuth();
    const router = useRouter();
    const { usuario } = useAuth();
    const usuarioLogado = !!token;

    const irParaCadastro = () => {
        const currentPath = window.location.pathname + window.location.search;
        router.push(`/cadastro?from=${encodeURIComponent(currentPath)}`);
    };

    const irParaLogin = () => {
        const currentPath = window.location.pathname + window.location.search;
        router.push(`/login?from=${encodeURIComponent(currentPath)}`);
    }

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
