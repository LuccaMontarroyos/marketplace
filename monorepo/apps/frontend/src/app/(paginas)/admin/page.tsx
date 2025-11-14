"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import LogoAlt from "@/components/template/LogoAlt";
import { IconUsers, IconPackage, IconShoppingBag, IconChartBar } from "@tabler/icons-react";
import Link from "next/link";

export default function AdminPage() {
  const { usuario } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!usuario) {
      router.push("/login");
      return;
    }
    if (!usuario.isAdmin) {
      router.push("/");
      return;
    }
  }, [usuario, router]);

  if (!usuario || !usuario.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="texto-azul text-lg">Carregando...</p>
      </div>
    );
  }

  const menuItems = [
    {
      title: "Gerenciar Usuários",
      description: "Visualizar, editar e excluir usuários do sistema",
      icon: IconUsers,
      href: "/admin/usuarios",
      color: "bg-blue-500",
    },
    {
      title: "Gerenciar Produtos",
      description: "Visualizar e gerenciar todos os produtos cadastrados",
      icon: IconShoppingBag,
      href: "/admin/produtos",
      color: "bg-green-500",
    },
    {
      title: "Gerenciar Pedidos",
      description: "Visualizar e gerenciar todos os pedidos do sistema",
      icon: IconPackage,
      href: "/admin/pedidos",
      color: "bg-purple-500",
    },
    {
      title: "Estatísticas",
      description: "Visualizar relatórios e estatísticas do marketplace",
      icon: IconChartBar,
      href: "/admin/estatisticas",
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <LogoAlt botaoSair={true} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold texto-azul mb-2">
            Painel Administrativo
          </h1>
          <p className="texto-azul opacity-70">
            Gerencie todos os aspectos do marketplace
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 group"
              >
                <div className={`${item.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-semibold texto-azul mb-2">
                  {item.title}
                </h3>
                <p className="texto-azul opacity-70 text-sm">
                  {item.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

