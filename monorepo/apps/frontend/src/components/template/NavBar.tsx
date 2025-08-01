"use client";
import { useEffect, useState } from "react";
import CarrinhoItem from "./CarrinhoItem"
import NavBarItem from "./NavBarItem"
import { IconShoppingCart } from "@tabler/icons-react";
import { useRouter } from 'next/navigation';
import { obterToken, removerToken } from "@/utils/token";

export default function NavBar({ onToggleCarrinho }: { onToggleCarrinho: () => void }) {
    const [usuarioLogado, setUsuarioLogado] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const token = obterToken();
        setUsuarioLogado(!!token);
    }, [])

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
                    <NavBarItem onClick={removerToken} texto={"Refazer pedido"} />
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
