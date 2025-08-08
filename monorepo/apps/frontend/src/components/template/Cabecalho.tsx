"use client";
import { IconAdjustmentsHorizontal } from "@tabler/icons-react";
import BarraPesquisa from "./BarraPesquisa"
import Logo from "./Logo"
import NavBar from "./NavBar"

export interface CabecalhoProps {
    onToggleCarrinho: () => void;
    onBuscarProdutos: (nome: string) => void;
    onToggleFiltros: () => void;
}

export default function Cabecalho({ onToggleCarrinho, onBuscarProdutos, onToggleFiltros }: CabecalhoProps) {
    return (
        <header className="flex items-center justify-between bg-verde pr-10 gap-3">
            <Logo />
            <div className="flex items-center gap-2">
                <div className="flex bg-white rounded-md overflow-hidden shadow-sm w-full">
                    <BarraPesquisa onBuscar={onBuscarProdutos} />
                    <button onClick={onToggleFiltros}
                        className="px-4 text-gray-500 hover:bg-gray-200 transition flex items-center justify-center border-l" title="Mostrar"
                    ><IconAdjustmentsHorizontal size={20} /></button>
                </div>
            </div>

            <NavBar onToggleCarrinho={onToggleCarrinho} />
        </header>
    )
};
