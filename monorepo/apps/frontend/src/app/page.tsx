"use client";

import { useState } from "react";
import BannerCarousel from "@/components/template/BannerCarrossel";
import Cabecalho from "@/components/template/Cabecalho";
import CardSection from "@/components/template/CardSection";
import Rodape from "@/components/template/Rodape";
import CarrinhoDrawer from "@/components/template/CarrinhoDrawer";
import { FiltrosProduto } from "@/types/Produto";
import FiltroProduto from "@/components/template/FiltroProduto";

export default function Home() {
    const [carrinhoAberto, setCarrinhoAberto] = useState(false);
    const [filtros, setFiltros] = useState<FiltrosProduto>({});
    const [mostrarFiltros, setMostrarFiltros] = useState(false);
    const [refreshCarrinho, setRefreshCarrinho] = useState(false);

    const atualizarCarrinhoLocal = () => {
        setRefreshCarrinho(prev => !prev);
        setCarrinhoAberto(true);
    };

    const handleBuscarProdutos = (nome: string) => {
        setFiltros((prev) => ({ ...prev, nome: nome || undefined }));
    };

    const handleFiltrarProdutos = (novosFiltros: FiltrosProduto) => {
        setFiltros((prev) => ({ ...prev, ...novosFiltros }));
    };
    
    return (
        <div className="min-h-screen bg-gray-50 overflow-x-hidden">
            <Cabecalho onToggleFiltros={() => setMostrarFiltros(!mostrarFiltros)} onBuscarProdutos={handleBuscarProdutos} onToggleCarrinho={() => setCarrinhoAberto(!carrinhoAberto)} />
            <div className="w-full">
                <BannerCarousel />
            </div>
            <main className="bg-gray-50 min-h-screen flex flex-col md:flex-row gap-4 md:gap-6 p-4 max-w-full">
                {mostrarFiltros && (
                    <div className="relative bg-white rounded-lg shadow-md p-4 md:p-6">
                        <FiltroProduto filtrosAtuais={filtros} onFiltrar={handleFiltrarProdutos} />
                        <button
                            onClick={() => setMostrarFiltros(false)}
                            className="absolute top-2 right-2 texto-verde hover:texto-azul rounded-full p-1 text-xl font-bold"
                            title="Fechar filtros"
                        >
                            ×
                        </button>
                    </div>
                )}
                <div className="flex-1 w-full min-w-0">
                    <CardSection onAddCarrinho={atualizarCarrinhoLocal} filtros={filtros} />
                </div>
            </main>
            <CarrinhoDrawer aberto={carrinhoAberto} onFechar={() => setCarrinhoAberto(false)} refresh={refreshCarrinho} />
            <Rodape />
        </div>
    )
};
