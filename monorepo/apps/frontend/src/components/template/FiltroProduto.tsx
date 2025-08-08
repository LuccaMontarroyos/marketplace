import { FiltrosProduto } from "@/types/Produto";
import { useEffect, useState } from "react";

export interface FiltroProdutoProps {
    onFiltrar: (filtros: FiltrosProduto) => void;
    filtrosAtuais: FiltrosProduto;
}

export default function FiltroProduto({ onFiltrar, filtrosAtuais }: FiltroProdutoProps) {
    const [nome, setNome] = useState(filtrosAtuais.nome || "");
    const [precoMin, setPrecoMin] = useState(filtrosAtuais.precoMin?.toString || "");
    const [precoMax, setPrecoMax] = useState(filtrosAtuais.precoMax?.toString || "");
    const [tipo, setTipo] = useState(filtrosAtuais.tipo || "");

    useEffect(() => {
        if (filtrosAtuais.nome !== nome) {
            setNome(filtrosAtuais.nome || "");
        }
    }, [filtrosAtuais.nome]);

    const aplicarFiltros = () => {

        onFiltrar({
            nome: nome || undefined,
            precoMin: precoMin ? Number(precoMin) : undefined,
            precoMax: precoMax ? Number(precoMax) : undefined,
            tipo: tipo || undefined,
        })
    }

    return (
        <div className="bg-white shadow-md p-4 rounded-md flex flex-col gap-3 max-w-xs">
            <h2 className="font-bold text-lg">Filtros</h2>

            <input
                type="text"
                placeholder="Buscar por nome..."
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="border px-2 py-1 rounded"
            />

            <div className="flex gap-2">
                <input
                    type="number"
                    placeholder="Preço mínimo"
                    value={precoMin}
                    onChange={(e) => setPrecoMin(e.target.value)}
                    className="border px-2 py-1 rounded w-full"
                />
                <input
                    type="number"
                    placeholder="Preço máximo"
                    value={precoMax}
                    onChange={(e) => setPrecoMax(e.target.value)}
                    className="border px-2 py-1 rounded w-full"
                />
            </div>

            <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="border px-2 py-1 rounded"
            >
                <option value="">Todos os tipos</option>
                <option value="ELETRONICOS">Eletrônicos</option>
                <option value="MOVEIS">Móveis</option>
                <option value="ROUPA">Roupa</option>
                <option value="CALCADOS">Calçados</option>
                <option value="LIVRO">Livro</option>
                <option value="AUTOMOVEIS">Automóveis</option>
                <option value="OUTROS">Outros</option>
            </select>

            <button
                onClick={aplicarFiltros}
                className="bg-verde text-white px-4 py-2 rounded hover:bg-green-600"
            >
                Aplicar
            </button>
        </div>
    );
};
