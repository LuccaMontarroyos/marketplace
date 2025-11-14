"use client";
import { useEffect, useState } from "react";
import { buscarFavoritos, removerFavorito, Favorito } from "@/services/favorito";
import { toast } from "react-toastify";
import Link from "next/link";
import Image from "next/image";
import { IconHeart, IconHeartFilled, IconShoppingCart } from "@tabler/icons-react";
import { adicionarAoCarrinho } from "@/services/carrinho";
import { useRouter } from "next/navigation";

export default function FavoritosPage() {
    const [favoritos, setFavoritos] = useState<Favorito[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        carregarFavoritos();
    }, []);

    const carregarFavoritos = async () => {
        try {
            setLoading(true);
            const dados = await buscarFavoritos();
            setFavoritos(dados);
        } catch (error: any) {
            toast.error("Erro ao carregar favoritos");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoverFavorito = async (idProduto: number) => {
        try {
            await removerFavorito(idProduto);
            toast.success("Produto removido dos favoritos");
            setFavoritos(favoritos.filter((f) => f.idProduto !== idProduto));
        } catch (error: any) {
            toast.error("Erro ao remover favorito");
            console.error(error);
        }
    };

    const handleAdicionarAoCarrinho = async (idProduto: number) => {
        try {
            await adicionarAoCarrinho(idProduto, 1);
            toast.success("Produto adicionado ao carrinho!");
            router.push("/");
        } catch (error: any) {
            toast.error("Erro ao adicionar ao carrinho");
            console.error(error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-xl">Carregando favoritos...</p>
            </div>
        );
    }

    if (favoritos.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-10">
                <IconHeart size={80} className="text-gray-400 mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Nenhum favorito ainda</h2>
                <p className="text-gray-600 mb-6">Adicione produtos aos seus favoritos para encontrá-los facilmente</p>
                <Link href="/" className="botao-verde px-6 py-2 rounded-lg">
                    Explorar produtos
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 bg-gray-50">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Meus Favoritos</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {favoritos.map((favorito) => {
                        const produto = favorito.produto;
                        const imagemPrincipal = produto?.imagens?.[0]?.url || "/defaultProduct.jpg";

                        return (
                            <div
                                key={favorito.id}
                                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                            >
                                <Link href={`/produto/${produto.id}`}>
                                    <div className="relative h-48 w-full">
                                        <Image
                                            src={imagemPrincipal}
                                            alt={produto.nome}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                </Link>
                                <div className="p-4">
                                    <Link href={`/produto/${produto.id}`}>
                                        <h3 className="font-semibold text-lg mb-2 hover:texto-verde transition-colors">
                                            {produto.nome}
                                        </h3>
                                    </Link>
                                    <p className="text-2xl font-bold texto-verde mb-4">
                                        R$ {Number(produto.preco)?.toFixed(2) || "0.00"}
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAdicionarAoCarrinho(produto.id)}
                                            className="flex-1 add-carrinho text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                                        >
                                            <IconShoppingCart size={20} />
                                            Adicionar
                                        </button>
                                        <button
                                            onClick={() => handleRemoverFavorito(produto.id)}
                                            className="p-2 border-2 border-red-300 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                                            title="Remover dos favoritos"
                                        >
                                            <IconHeartFilled size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

