"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import LogoAlt from "@/components/template/LogoAlt";
import { buscarProdutos, Produto } from "@/services/produto";
import { toast } from "react-toastify";
import { IconTrash, IconEye } from "@tabler/icons-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import Image from "next/image";

export default function AdminProdutosPage() {
  const { usuario } = useAuth();
  const router = useRouter();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!usuario) {
      router.push("/login");
      return;
    }
    if (!usuario.isAdmin) {
      router.push("/");
      return;
    }
    carregarProdutos();
  }, [usuario, router]);

  const carregarProdutos = async () => {
    try {
      setLoading(true);
      const dados = await buscarProdutos();
      setProdutos(dados);
    } catch (error: any) {
      toast.error("Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  };

  if (!usuario || !usuario.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="texto-azul text-lg">Carregando...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LogoAlt botaoSair={true} />
        <div className="flex items-center justify-center py-20">
          <p className="texto-azul text-lg">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LogoAlt botaoSair={true} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold texto-azul mb-2">Gerenciar Produtos</h1>
            <p className="texto-azul opacity-70">
              Total de produtos: {produtos.length}
            </p>
          </div>
          <Link
            href="/admin"
            className="botao-verde px-4 py-2 rounded-lg text-white"
          >
            Voltar ao Painel
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {produtos.map((produto) => {
            const imagemPrincipal = produto.imagens?.[0]?.url || "/defaultProduct.jpg";
            return (
              <div
                key={produto.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full"
              >
                <div className="relative h-48 w-full">
                  <Image
                    src={imagemPrincipal}
                    alt={produto.nome}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="p-4 flex flex-col gap-3 flex-1">
                  <h3 className="text-lg font-semibold texto-azul mb-2 line-clamp-2">
                    {produto.nome}
                  </h3>
                  <p className="text-sm texto-azul opacity-70 line-clamp-2 flex-grow">
                    {produto.descricao}
                  </p>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xl font-bold texto-verde">
                      R$ {Number(produto.preco).toFixed(2)}
                    </p>
                    <span className="text-xs texto-azul opacity-70">
                      Estoque: {produto.qtdEstoque}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs texto-azul opacity-70 mb-3">
                    <span>
                      Cadastrado em: {format(new Date(produto.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <Link
                      href={`/produto/${produto.id}`}
                      className="flex-1 botao-verde px-4 py-2 rounded-lg text-white text-center text-sm"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <IconEye size={18} />
                        Ver Detalhes
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {produtos.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="texto-azul text-lg">Nenhum produto cadastrado</p>
          </div>
        )}
      </div>
    </div>
  );
}

