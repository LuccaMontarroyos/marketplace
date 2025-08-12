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
        setCarrinhoAberto(true);  // alterna entre true/false para forçar refresh
    };

    const handleBuscarProdutos = (nome: string) => {
        setFiltros((prev) => ({ ...prev, nome: nome || undefined }));
    };

    const handleFiltrarProdutos = (novosFiltros: FiltrosProduto) => {
        setFiltros((prev) => ({ ...prev, ...novosFiltros }));
    };

    // const abrirCarrinho = () => {
    //     setCarrinhoAberto(true);
    // }

    return (
        <div>
            <Cabecalho onToggleFiltros={() => setMostrarFiltros(!mostrarFiltros)} onBuscarProdutos={handleBuscarProdutos} onToggleCarrinho={() => setCarrinhoAberto(!carrinhoAberto)} />
            <main className="bg-white min-h-screen flex gap-6 p-4">
                {mostrarFiltros && (
                    <div className="relative">
                        <FiltroProduto filtrosAtuais={filtros} onFiltrar={handleFiltrarProdutos} />
                        <button
                            onClick={() => setMostrarFiltros(false)}
                            className="absolute top-2 right-2 texto-verde rounded-full p-1 "
                        >
                            ✕
                        </button>
                    </div>
                )}
                <div className="flex-1">
                    <BannerCarousel />
                    <CardSection onAddCarrinho={atualizarCarrinhoLocal} filtros={filtros} />
                </div>
            </main>
            <CarrinhoDrawer aberto={carrinhoAberto} onFechar={() => setCarrinhoAberto(false)} refresh={refreshCarrinho} />
            <Rodape />
        </div>
    )
};
