"use client";
import CarrinhoItem from "./CarrinhoItem"
import NavBarItem from "./NavBarItem"
import { IconShoppingCart } from "@tabler/icons-react";
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/AuthContext";

export default function NavBar({ onToggleCarrinho }: { onToggleCarrinho: () => void }) {
    const { token, logout } = useAuth();
    const router = useRouter();

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

    return (
        <>
            {usuarioLogado ? (
                <nav className="flex gap-20 text-md">
                    <NavBarItem link={"/cadastro/produto"} texto={"Cadastrar produto"} />
                    <NavBarItem onClick={() => {logout();router.push("/login");}} texto={"Refazer pedido"} />
                    <CarrinhoItem onClick={onToggleCarrinho} link="" icone={IconShoppingCart} />
                    <NavBarItem link={"/perfil"} texto={"Perfil"} />
                </nav>
            ) : (
                <nav className="flex gap-20 text-md">
                    <CarrinhoItem onClick={onToggleCarrinho} link="" icone={IconShoppingCart} />
                    <NavBarItem onClick={irParaLogin} texto={"Login"} />
                    <NavBarItem onClick={irParaCadastro} texto={"Cadastro"} />
                </nav>
            )}
        </>
    )
};
