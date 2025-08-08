"use client";
import BarraPesquisa from "./BarraPesquisa"
import Logo from "./Logo"
import NavBar from "./NavBar"

export interface CabecalhoProps {
    onToggleCarrinho: () => void;
    onBuscarProdutos: (nome: string) => void;
}

export default function Cabecalho({ onToggleCarrinho, onBuscarProdutos }: CabecalhoProps) {
    return (
        <header className="flex items-center justify-between bg-verde pr-10">
            <Logo />
            <BarraPesquisa onBuscar={onBuscarProdutos} />
            <NavBar onToggleCarrinho={onToggleCarrinho} />
        </header>
    )
};
