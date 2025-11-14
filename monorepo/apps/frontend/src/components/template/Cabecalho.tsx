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
        <header className="flex flex-col md:flex-row items-center justify-between bg-verde px-4 md:pr-10 gap-3 py-3 md:py-0">
            <Logo />
            <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="flex bg-white rounded-md overflow-hidden shadow-sm w-full md:w-auto">
                    <BarraPesquisa onBuscar={onBuscarProdutos} />
                    <button onClick={onToggleFiltros}
                        className="px-3 md:px-4 texto-azul hover:bg-gray-200 transition flex items-center justify-center border-l" title="Mostrar filtros"
                    ><IconAdjustmentsHorizontal size={20} /></button>
                </div>
            </div>

            <NavBar onToggleCarrinho={onToggleCarrinho} />
        </header>
    )
};
