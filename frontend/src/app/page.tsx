"use client";

import { useState } from "react";
import BannerCarousel from "@/components/template/BannerCarrossel";
import Cabecalho from "@/components/template/Cabecalho";
import CardSection from "@/components/template/CardSection";
import Rodape from "@/components/template/Rodape";
import CarrinhoDrawer from "@/components/template/CarrinhoDrawer";

export default function Home() {
    const [carrinhoAberto, setCarrinhoAberto] = useState(false);

    return (
        <div>
            <Cabecalho onToggleCarrinho={() => setCarrinhoAberto(!carrinhoAberto)} />
            <main className="bg-white vh-100">
                <BannerCarousel />
                <CardSection />
            </main>
            <CarrinhoDrawer aberto={carrinhoAberto} onFechar={() => setCarrinhoAberto(false)} />
            <Rodape />
        </div>
    )
};
