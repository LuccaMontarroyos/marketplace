'use client';
import { useEffect, useState } from 'react';
import { DndContext, closestCenter, useSensor, useSensors, MouseSensor, TouchSensor, } from '@dnd-kit/core';
import {
    SortableContext, useSortable, arrayMove, rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { produtoSchema } from "../../../../../../../packages/shared/schemas/produto";
import { Produto } from "@/types/Produto";
import { buscarProdutosDoUsuario } from '@/services/produto';

// Componente individual da imagem com suporte a drag
function SortableImage({
    id,
    src,
    onRemove,
}: {
    id: string;
    src: string;
    onRemove: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="relative aspect-square rounded overflow-hidden cursor-move"
        >
            <div {...attributes} {...listeners} className="absolute inset-0 z-0" />
            <img src={src} className="object-cover w-full h-full pointer-events-none" />
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                }}
                className="absolute top-1 right-1 z-10 bg-black text-white rounded-full w-6 h-6 text-xs flex items-center justify-center"
            >
                ✕
            </button>
        </div>
    );
}

export default function MeusProdutos() {
    const [produtos, setProdutos] = useState<Produto[]>();

    const buscarProdutos = async (): Promise<Produto[]> => {
        const produtosEncontrados = await buscarProdutosDoUsuario();
        setProdutos(produtosEncontrados);
        console.log(produtosEncontrados);
        return produtosEncontrados;
    }


    useEffect(() => {
        buscarProdutos();
    }, [])


    const [editandoIndex, setEditandoIndex] = useState<number | null>(null);
    const [produtoEditado, setProdutoEditado] = useState<any>(null);
    const [errosValidacao, setErrosValidacao] = useState<Record<string, string[]>>({});


    const sensores = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

    const handleEditar = (index: number) => {
        setEditandoIndex(index);
        if (produtos) {
            setProdutoEditado({ ...produtos[index], imagens: [...produtos[index].imagens] });
        }
    };

    const handleExcluirProduto = (index: number) => {
        if (produtos) {
            const novos = [...produtos];
            novos.splice(index, 1);
            setProdutos(novos);
        }
    };

    const handleSalvar = (index: number) => {

        console.log("Produto sendo salvo:", produtoEditado);

        const parsed = produtoSchema.safeParse(produtoEditado);

        if (!parsed.success) {
            const erros = parsed.error.flatten().fieldErrors;
            console.log("Erros de validação:", erros);
            setErrosValidacao(erros);
            return;
        }
        if (produtos) {
            const novos = [...produtos];
            novos[index] = produtoEditado;
            setProdutos(novos);
            setEditandoIndex(null);
            setErrosValidacao({});
        }
    };

    const handleExcluirImagem = (i: number) => {
        setProdutoEditado((prev: any) => {
            const novasImagens = prev.imagens.filter((_: string, idx: number) => idx !== i);
            return {
                ...prev,
                imagens: [...novasImagens]
            };
        });
    };

    const handleAdicionarImagens = (files: FileList | null) => {
        if (!files) return;
        const novas = Array.from(files).map((file) => URL.createObjectURL(file));
        setProdutoEditado((prev: any) => ({
            ...prev,
            imagens: [...prev.imagens, ...novas].slice(0, 6), // max 6 imagens
        }));
    };

    const handleChangeCampo = (campo: string, valor: string | number) => {
        setProdutoEditado((prev: any) => ({ ...prev, [campo]: valor }));
    };

    const handleReordenar = (event: any) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = produtoEditado.imagens.findIndex((img: string) => img === active.id);
            const newIndex = produtoEditado.imagens.findIndex((img: string) => img === over.id);
            setProdutoEditado((prev: any) => ({
                ...prev,
                imagens: arrayMove(prev.imagens, oldIndex, newIndex),
            }));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4 texto-azul">
            <h1 className="text-3xl font-bold text-center mb-10">Meus Produtos</h1>
            <div className="space-y-8 max-w-5xl mx-auto">
                {produtos && produtos.map((produto, index) => (
                    <div key={index} className="bg-white p-6 rounded-lg shadow-md space-y-4">
                        {editandoIndex === index ? (
                            <>
                                <DndContext sensors={sensores} collisionDetection={closestCenter} onDragEnd={handleReordenar}>
                                    <SortableContext items={produtoEditado.imagens} strategy={rectSortingStrategy}>
                                        <div className="grid grid-cols-6 gap-2">
                                            {produtoEditado.imagens.map((img: string, i: number) => (
                                                <SortableImage
                                                    key={img}
                                                    id={img}
                                                    src={img}
                                                    onRemove={() => handleExcluirImagem(i)}
                                                />
                                            ))}
                                            {produtoEditado.imagens.length < 6 &&
                                                Array.from({ length: 6 - produtoEditado.imagens.length }).map((_, i) => (
                                                    <label
                                                        key={`vazio-${i}`}
                                                        className="aspect-square border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 cursor-pointer rounded"
                                                    >
                                                        + Imagem
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => handleAdicionarImagens(e.target.files)}
                                                        />
                                                    </label>
                                                ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>

                                <input
                                    className="border px-3 py-2 w-full mt-2"
                                    value={produtoEditado.nome}
                                    onChange={(e) => handleChangeCampo('nome', e.target.value)}
                                />
                                {errosValidacao.nome && (
                                    <p className="text-red-500 text-sm mt-1">{errosValidacao.nome[0]}</p>
                                )}
                                <textarea
                                    className="border px-3 py-2 w-full mt-2"
                                    value={produtoEditado.descricao}
                                    onChange={(e) => handleChangeCampo('descricao', e.target.value)}
                                />
                                {errosValidacao.descricao && (
                                    <p className="text-red-500 text-sm mt-1">{errosValidacao.descricao[0]}</p>
                                )}
                                <div className="flex gap-4 mt-2">
                                    <input
                                        type="number"
                                        className="border px-3 py-2 w-1/2"
                                        value={produtoEditado.preco}
                                        onChange={(e) => handleChangeCampo('preco', parseFloat(e.target.value))}
                                        placeholder="Preço"
                                    />
                                    {errosValidacao.preco && (
                                        <p className="text-red-500 text-sm mt-1">{errosValidacao.preco[0]}</p>
                                    )}
                                    <input
                                        type="number"
                                        className="border px-3 py-2 w-1/2"
                                        value={produtoEditado.qtdEstoque}
                                        onChange={(e) => handleChangeCampo('qtdEstoque', parseInt(e.target.value))}
                                        placeholder="Qtd Estoque"
                                    />
                                    {errosValidacao.qtdEstoque && (
                                        <p className="text-red-500 text-sm mt-1">{errosValidacao.qtdEstoque[0]}</p>
                                    )}
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        onClick={() => handleSalvar(index)}
                                        className="px-4 py-2 rounded border border-gray-400 bg-gray-100 hover:bg-gray-200"
                                    >
                                        Salvar
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="grid grid-cols-6 gap-2">
                                    {produto.imagens.map((img, i) => (
                                        <img
                                            key={i}
                                            src={img}
                                            className="aspect-square object-cover w-full rounded"
                                        />
                                    ))}
                                    {Array.from({ length: 6 - produto.imagens.length }).map((_, i) => (
                                        <div
                                            key={`vazio-${i}`}
                                            className='aspect-square rounded border-2 border-gray-300 flex items-center justify-center text-gray-400 bg-gray-200'></div>
                                    ))}
                                </div>
                                <h2 className="text-xl font-semibold">{produto.nome}</h2>
                                <p className="text-gray-700">{produto.descricao}</p>
                                <p className="text-lg font-bold mt-2">R$ {Number(produto.preco).toFixed(2)}</p>
                                <p className="text-sm text-gray-600">Quantidade em estoque: {produto.qtdEstoque}</p>
                                <p className="text-md">Tipo: {produto.tipo}</p>

                                <div className="flex gap-4 justify-end pt-2">
                                    <button
                                        onClick={() => handleEditar(index)}
                                        className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleExcluirProduto(index)}
                                        className='px-4 py-2 rounded bg-gray-400 hover:bg-gray-500 text-white'>
                                        Excluir
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}