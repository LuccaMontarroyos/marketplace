import { FiltrosProduto, Produto } from "@/types/Produto";
import Card from "./Card";
import { useEffect, useState } from "react";
import { buscarProdutos } from "@/services/produto";

export interface CardSectionProps {
    filtros?: FiltrosProduto;
    onAddCarrinho: () => void;
}

export default function CardSection({filtros, onAddCarrinho}: CardSectionProps) {
    const [produtos, setProdutos] = useState<Produto[]>([]);

    const buscarOsProdutos = async () => {
        const produtosEncontrados = await buscarProdutos(filtros);
        setProdutos(produtosEncontrados);
    }

    useEffect(() => {
        buscarOsProdutos();
    }, [JSON.stringify(filtros)])

    return (
        <div className="p-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {produtos.map((produto) => (
                <Card key={produto.id} imagem={produto.imagens.length ? produto.imagens[0].url : "/imagem1.jpg" } idProduto={produto.id} nome={produto.nome} descricao={produto.descricao} idVendedor={produto.idVendedor} preco={produto.preco} onAddCarrinho={onAddCarrinho} />
            ))}
        </div>
    )
};
