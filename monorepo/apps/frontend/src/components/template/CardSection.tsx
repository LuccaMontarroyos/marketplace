import { FiltrosProduto, Produto } from "@/types/Produto";
import Card from "./Card";
import { useEffect, useState } from "react";
import { buscarProdutos } from "@/services/produto";

export default function CardSection({ filtros }: { filtros?: FiltrosProduto }) {
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
                <Card key={produto.id} idProduto={produto.id} nome={produto.nome} descricao={produto.descricao} idVendedor={produto.idVendedor}/>
            ))}
        </div>
    )
};
