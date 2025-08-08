import { FiltrosProduto, Produto } from "@/types/Produto";
import Card from "./Card";
import { useEffect, useState } from "react";
import { buscarProdutos } from "@/services/produto";

export default function CardSection({ filtros }: { filtros?: FiltrosProduto }) {
    const [produtos, setProdutos] = useState<Produto[]>([]);

    const buscarOsProdutos = async () => {
        const produtosEncontrados = await buscarProdutos();
        console.log(produtosEncontrados);
        setProdutos(produtosEncontrados);
    }

    useEffect(() => {
        buscarOsProdutos();
    }, [JSON.stringify(filtros)])

    return (
        <div className="p-10">
            {produtos.map((produto) => {
                return <Card key={produto.id} idProduto={produto.id} nome={produto.nome} descricao={produto.descricao} idVendedor={produto.idVendedor}/>
            })}
            <Card idProduto={1} />
        </div>
    )
};
