"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import LogoAlt from "@/components/template/LogoAlt";
import { buscarUsuarios } from "@/services/admin";
import { buscarProdutos } from "@/services/produto";
import { buscarPedidosDoComprador } from "@/services/pedido";
import { toast } from "react-toastify";
import { IconUsers, IconShoppingBag, IconPackage, IconTrendingUp } from "@tabler/icons-react";
import Link from "next/link";

export default function AdminEstatisticasPage() {
  const { usuario } = useAuth();
  const router = useRouter();
  const [estatisticas, setEstatisticas] = useState({
    totalUsuarios: 0,
    totalVendedores: 0,
    totalProdutos: 0,
    totalPedidos: 0,
    loading: true,
  });

  useEffect(() => {
    if (!usuario) {
      router.push("/login");
      return;
    }
    if (!usuario.isAdmin) {
      router.push("/");
      return;
    }
    carregarEstatisticas();
  }, [usuario, router]);

  const carregarEstatisticas = async () => {
    try {
      const [usuarios, produtos, pedidos] = await Promise.all([
        buscarUsuarios(),
        buscarProdutos(),
        buscarPedidosDoComprador(),
      ]);

      const vendedores = usuarios.filter((u) => u.isVendedor);

      setEstatisticas({
        totalUsuarios: usuarios.length,
        totalVendedores: vendedores.length,
        totalProdutos: produtos.length,
        totalPedidos: pedidos.length,
        loading: false,
      });
    } catch (error: any) {
      toast.error("Erro ao carregar estatísticas");
      console.error(error);
      setEstatisticas((prev) => ({ ...prev, loading: false }));
    }
  };

  if (!usuario || !usuario.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="texto-azul text-lg">Carregando...</p>
      </div>
    );
  }

  const cards = [
    {
      title: "Total de Usuários",
      value: estatisticas.totalUsuarios,
      icon: IconUsers,
      color: "bg-blue-500",
      href: "/admin/usuarios",
    },
    {
      title: "Vendedores",
      value: estatisticas.totalVendedores,
      icon: IconTrendingUp,
      color: "bg-green-500",
      href: "/admin/usuarios",
    },
    {
      title: "Produtos Cadastrados",
      value: estatisticas.totalProdutos,
      icon: IconShoppingBag,
      color: "bg-purple-500",
      href: "/admin/produtos",
    },
    {
      title: "Total de Pedidos",
      value: estatisticas.totalPedidos,
      icon: IconPackage,
      color: "bg-orange-500",
      href: "/admin/pedidos",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <LogoAlt botaoSair={true} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold texto-azul mb-2">Estatísticas</h1>
            <p className="texto-azul opacity-70">
              Visão geral do marketplace
            </p>
          </div>
          <Link
            href="/admin"
            className="botao-verde px-4 py-2 rounded-lg text-white"
          >
            Voltar ao Painel
          </Link>
        </div>

        {estatisticas.loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="texto-azul text-lg">Carregando estatísticas...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.title}
                  href={card.href}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300"
                >
                  <div className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                    <Icon size={24} className="text-white" />
                  </div>
                  <h3 className="text-sm texto-azul opacity-70 mb-2">{card.title}</h3>
                  <p className="text-3xl font-bold texto-azul">{card.value}</p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

