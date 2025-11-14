import { FiltrosProduto, Produto } from "@/types/Produto";
import Card from "./Card";
import { useEffect, useState } from "react";
import { buscarProdutos, buscarProdutosDoUsuario } from "@/services/produto";

export interface CardSectionProps {
    filtros?: FiltrosProduto;
    onAddCarrinho?: () => void;
    idUsuario?: number;
}

export default function CardSection({filtros, onAddCarrinho, idUsuario}: CardSectionProps) {
    const [produtos, setProdutos] = useState<Produto[]>([]);

    const buscarOsProdutos = async () => {
        try {
            let produtosEncontrados: Produto[] = [];
            if (idUsuario) {
                produtosEncontrados = await buscarProdutosDoUsuario(idUsuario);
            } else {
                produtosEncontrados = await buscarProdutos(filtros);
            }
            setProdutos(produtosEncontrados);
        } catch (error) {
            console.error("Erro ao buscar produtos:", error);
        }
    };

    useEffect(() => {
        buscarOsProdutos();
    }, [JSON.stringify(filtros), idUsuario])

    return (
        <div className="p-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {produtos.map((produto) => (
                <Card key={produto.id} imagem={produto.imagens.length ? produto.imagens[0].url : "/imagem1.jpg" } idProduto={produto.id} nome={produto.nome} descricao={produto.descricao} idVendedor={produto.idVendedor} preco={produto.preco} onAddCarrinho={onAddCarrinho} />
            ))}
        </div>
    )
};
