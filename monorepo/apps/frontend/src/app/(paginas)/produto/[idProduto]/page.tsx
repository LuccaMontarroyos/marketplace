"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import LogoAlt from "@/components/template/LogoAlt";
import Link from "next/link";
import { buscarProdutoById } from "@/services/produto";
import { adicionarAoCarrinho } from "@/services/carrinho";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Produto } from "@/types/Produto";
import { Usuario } from "@/types/Usuario";
import { buscarUsuarioPorId } from "@/services/usuario";
import { adicionarFavorito, removerFavorito, buscarFavoritos } from "@/services/favorito";
import { useAuth } from "@/context/AuthContext";
import { IconHeart, IconHeartFilled } from "@tabler/icons-react";
import AvaliacoesProduto from "@/components/template/AvaliacoesProduto";

export default function Page() {
    const params = useParams();
    const idProduto = params.idProduto;
    const [produto, setProduto] = useState<Produto | null>(null);
    const [imagemPrincipal, setImagemPrincipal] = useState<string | null>(null);
    const [vendedor, setVendedor] = useState<Usuario | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [adicionando, setAdicionando] = useState(false);
    const [ehFavorito, setEhFavorito] = useState(false);
    const { usuario } = useAuth();
    const idVendedor = produto?.idVendedor || 1;

    useEffect(() => {
        if (idProduto) {
            const buscarProduto = async () => {
                try {
                    const respostaProduto = await buscarProdutoById(Number(idProduto));
                    setProduto(respostaProduto);
                    const vendedor = await buscarUsuarioPorId(respostaProduto.idVendedor);
                    setVendedor(vendedor);
                    if (respostaProduto.imagens && respostaProduto.imagens.length > 0) {
                        setImagemPrincipal(respostaProduto.imagens[0].url);
                    } else {
                        setImagemPrincipal(null);
                    }
                } catch (error) {
                    console.error("Falha ao buscar produto:", error);
                } finally {
                    setCarregando(false);
                }
            };
            buscarProduto();
        }
    }, [idProduto]);

    useEffect(() => {
        const verificarFavorito = async () => {
            if (usuario && produto) {
                try {
                    const favoritos = await buscarFavoritos();
                    const favoritoEncontrado = favoritos.some(
                        (f) => f.idProduto === produto.id
                    );
                    setEhFavorito(favoritoEncontrado);
                } catch (error) {
                    console.error("Erro ao verificar favorito:", error);
                }
            }
        };
        verificarFavorito();
    }, [usuario, produto]);

    if (carregando) {
        return (
            <div className="bg-gray-200 h-lvh text-black flex justify-center items-center">
                <p>Carregando produto...</p>
            </div>
        );
    }

    if (!produto) {
        return (
            <div className="bg-gray-200 h-lvh text-black flex justify-center items-center">
                <p>Produto não encontrado.</p>
            </div>
        );
    }

    const semImagens = !produto.imagens || produto.imagens.length === 0;

    const handleAdicionarCarrinho = async (quantidade = 1) => {
        if (!produto) return;
        setAdicionando(true);

        try {
            await adicionarAoCarrinho(produto.id, quantidade);
            toast.success(`${produto.nome} adicionado ao carrinho!`);
        } catch (error: any) {
            const mensagem =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                "Erro ao adicionar produto ao carrinho.";
            toast.error(mensagem);
            console.error("Erro ao adicionar ao carrinho:", error);
        } finally {
            setAdicionando(false);
        }
    };

    const handleToggleFavorito = async () => {
        if (!usuario) {
            toast.error("Você precisa estar logado para adicionar aos favoritos");
            return;
        }

        if (!produto) return;

        try {
            if (ehFavorito) {
                await removerFavorito(produto.id);
                setEhFavorito(false);
                toast.success("Produto removido dos favoritos");
            } else {
                await adicionarFavorito(produto.id);
                setEhFavorito(true);
                toast.success("Produto adicionado aos favoritos");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Erro ao atualizar favorito");
            console.error("Erro ao atualizar favorito:", error);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen text-black">
            <LogoAlt />
            <ToastContainer position="top-right" autoClose={3000} />

            <div className="py-15 bg-white max-w-6xl mx-auto p-4 md:p-6 flex flex-col md:flex-row gap-8 mt-6 md:mt-10 rounded-md shadow-md">
                <div className="flex flex-col md:flex-row gap-4">
                    {!semImagens ? (
                        <div className="flex md:flex-col gap-2">
                            {produto.imagens.map((imagem, index) => (
                                <button
                                    key={index}
                                    onClick={() => setImagemPrincipal(imagem.url)}
                                    className={`p-0 relative rounded-md overflow-hidden ${imagemPrincipal === imagem.url ? "ring-2 ring-blue-400" : ""
                                        }`}
                                >
                                    <Image
                                        src={imagem.url}
                                        alt={`Imagem ${index + 1} de ${produto.nome}`}
                                        width={80}
                                        height={80}
                                        className="object-cover rounded-md cursor-pointer"
                                    />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex md:flex-col gap-2">

                            {Array.from({ length: 3 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="w-[80px] h-[80px] bg-gray-200 animate-pulse rounded-md"
                                />
                            ))}
                        </div>
                    )}


                    <div className="flex items-center justify-center bg-gray-100 rounded-lg w-full md:w-[500px] h-[300px] md:h-[500px]">
                        {!semImagens ? (
                            <Image
                                src={imagemPrincipal ?? produto.imagens[0].url}
                                alt={`Imagem principal de ${produto.nome}`}
                                width={500}
                                height={500}
                                className="object-cover rounded-lg max-h-[500px] w-full h-full"
                                unoptimized
                            />
                        ) : (
                            <Image
                                src="/defaultProduct.jpg"
                                alt={`Imagem padrão de ${produto.nome}`}
                                width={500}
                                height={500}
                                className="object-cover rounded-lg w-full h-full"
                                unoptimized
                            />
                        )}
                    </div>
                </div>


                <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                        <h1 className="text-3xl font-bold">{produto.nome}</h1>
                        {usuario && (
                            <button
                                onClick={handleToggleFavorito}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                title={ehFavorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                            >
                                {ehFavorito ? (
                                    <IconHeartFilled size={28} className="text-red-500" />
                                ) : (
                                    <IconHeart size={28} className="text-gray-400" />
                                )}
                            </button>
                        )}
                    </div>

                    <p className="text-2xl font-semibold mb-4 texto-verde">
                        {Number(produto.preco).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                        })}
                    </p>

                    <p className="texto-azul mb-6">{produto.descricao}</p>

                    <div className="flex gap-4 mb-6">
                        <button
                            onClick={() => handleAdicionarCarrinho(1)}
                            disabled={adicionando}
                            className={`text-white px-6 py-2 rounded add-carrinho transition ${adicionando ? "opacity-70 cursor-not-allowed" : ""
                                }`}
                        >
                            {adicionando ? "Adicionando..." : "Adicionar ao Carrinho"}
                        </button>
                    </div>


                    <div className="mt-8 border-t border-gray-300 pt-4">
                        <h2 className="text-lg font-semibold mb-2 texto-azul">
                            Informações adicionais
                        </h2>
                        <ul className="list-disc list-inside texto-azul space-y-1">
                            <li>Quantidade em estoque: {produto.qtdEstoque}</li>
                            <li>Tipo do produto: {produto.tipo}</li>
                            <li>
                                Vendido por{" "}
                                <Link
                                    href={`/usuarios/${idVendedor}`}
                                    className="link-perfil hover:underline"
                                >
                                    {vendedor?.nome}
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {produto && (
                <div className="bg-white max-w-6xl mx-auto p-4 mt-6 rounded-md">
                    <AvaliacoesProduto idProduto={produto.id} />
                </div>
            )}
        </div>
    );
}