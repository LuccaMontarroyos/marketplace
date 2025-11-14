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

export default function Page() {
    const params = useParams();
    const idProduto = params.idProduto;
    const [produto, setProduto] = useState<Produto | null>(null);
    const [imagemPrincipal, setImagemPrincipal] = useState<string | null>(null);
    const [vendedor, setVendedor] = useState<Usuario | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [adicionando, setAdicionando] = useState(false);
    const idVendedor = 1;

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

    return (
        <div className="bg-gray-200 min-h-lvh text-black">
            <LogoAlt />
            <ToastContainer position="top-right" autoClose={3000} />

            <div className="py-15 bg-white max-w-6xl mx-auto p-4 flex flex-col md:flex-row gap-8 mt-10 rounded-md">
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


                    <div className="flex items-center justify-center bg-gray-100 rounded-lg w-[500px] h-[500px]">
                        {!semImagens ? (
                            <Image
                                src={imagemPrincipal ?? produto.imagens[0].url}
                                alt={`Imagem principal de ${produto.nome}`}
                                width={500}
                                height={500}
                                className="object-cover rounded-lg max-h-[500px]"
                            />
                        ) : (
                            <div className="w-[90%] h-[90%] bg-gray-200 animate-pulse rounded-lg" />
                        )}
                    </div>
                </div>


                <div className="flex-1">
                    <h1 className="text-3xl font-bold mb-2">{produto.nome}</h1>

                    <p className="text-2xl font-semibold mb-4 text-green-700">
                        {Number(produto.preco).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                        })}
                    </p>

                    <p className="text-gray-700 mb-6">{produto.descricao}</p>

                    <button
                        onClick={() => handleAdicionarCarrinho(1)}
                        disabled={adicionando}
                        className={`text-white px-6 py-2 rounded add-carrinho transition ${adicionando ? "opacity-70 cursor-not-allowed" : ""
                            }`}
                    >
                        {adicionando ? "Adicionando..." : "Adicionar ao Carrinho"}
                    </button>


                    <div className="mt-8 border-t border-gray-300 pt-4">
                        <h2 className="text-lg font-semibold mb-2">
                            Informações adicionais
                        </h2>
                        <ul className="list-disc list-inside text-gray-700">
                            <li>Quantidade em estoque: {produto.qtdEstoque}</li>
                            <li>Tipo do produto: {produto.tipo}</li>
                            <li>Produto postado em 23 de Nov de 2023</li>
                            <li>
                                Vendido por{" "}
                                <Link
                                    href={`/usuarios/${idVendedor}`}
                                    className="link-perfil text-blue-600 hover:underline"
                                >
                                    {vendedor?.nome}
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}