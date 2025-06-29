"use client";
import BarraPesquisa from "./BarraPesquisa"
import Logo from "./Logo"
import NavBar from "./NavBar"

export default function Cabecalho({ onToggleCarrinho }: { onToggleCarrinho: () => void }) {
    return (
        <header className="flex items-center justify-between bg-verde pr-10">
            <Logo />
            <BarraPesquisa />
            <NavBar onToggleCarrinho={onToggleCarrinho} />
        </header>
    )
};
