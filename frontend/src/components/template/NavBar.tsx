"use client";
import CarrinhoItem from "./CarrinhoItem"
import NavBarItem from "./NavBarItem"
import { IconShoppingCart } from "@tabler/icons-react";

export default function NavBar({ onToggleCarrinho }: { onToggleCarrinho: () => void }) {
    const usuarioLogado = true;

    return (
        <>
            {usuarioLogado ? (
                <nav className="flex gap-20 text-md">
                    <NavBarItem link={"/cadastro/produto"} texto={"Cadastrar produto"} />
                    <NavBarItem link={""} texto={"Refazer pedido"} />
                    <CarrinhoItem onClick={onToggleCarrinho} link="" icone={IconShoppingCart} />
                    <NavBarItem link={"/perfil"} texto={"Perfil"} />
                </nav>
            ) : (
                <nav className="flex gap-20 text-md">
                    <CarrinhoItem onClick={onToggleCarrinho} link="" icone={IconShoppingCart} />
                    <NavBarItem link={""} texto={"Login"} />
                    <NavBarItem link={""} texto={"Cadastro"} />
                </nav>
            )}
        </>
    )
};
