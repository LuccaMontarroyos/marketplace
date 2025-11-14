"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import LogoAlt from "@/components/template/LogoAlt";
import { buscarUsuarios, excluirUsuario, UsuarioAdmin } from "@/services/admin";
import { toast } from "react-toastify";
import { IconTrash, IconUser, IconShoppingBag, IconStar, IconPackage } from "@tabler/icons-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

export default function AdminUsuariosPage() {
  const { usuario } = useAuth();
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
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
    carregarUsuarios();
  }, [usuario, router]);

  const carregarUsuarios = async () => {
    try {
      setLoading(true);
      const dados = await buscarUsuarios();
      setUsuarios(dados);
    } catch (error: any) {
      toast.error("Erro ao carregar usuários");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExcluirUsuario = async (id: number, nome: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o usuário "${nome}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await excluirUsuario(id);
      toast.success("Usuário excluído com sucesso");
      carregarUsuarios();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao excluir usuário");
      console.error(error);
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
          <p className="texto-azul text-lg">Carregando usuários...</p>
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
            <h1 className="text-3xl font-bold texto-azul mb-2">Gerenciar Usuários</h1>
            <p className="texto-azul opacity-70">
              Total de usuários: {usuarios.length}
            </p>
          </div>
          <Link
            href="/admin"
            className="botao-verde px-4 py-2 rounded-lg text-white"
          >
            Voltar ao Painel
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold texto-azul">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold texto-azul">Nome</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold texto-azul">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold texto-azul">CPF</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold texto-azul">Tipo</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold texto-azul">Estatísticas</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold texto-azul">Cadastrado em</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold texto-azul">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {usuarios.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm texto-azul">{user.id}</td>
                    <td className="px-4 py-3 text-sm texto-azul font-medium">{user.nome}</td>
                    <td className="px-4 py-3 text-sm texto-azul">{user.email}</td>
                    <td className="px-4 py-3 text-sm texto-azul">{user.cpf}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-wrap gap-1">
                        {user.isAdmin && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">
                            Admin
                          </span>
                        )}
                        {user.isVendedor && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                            Vendedor
                          </span>
                        )}
                        {!user.isAdmin && !user.isVendedor && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-semibold">
                            Cliente
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-wrap gap-3 texto-azul">
                        <div className="flex items-center gap-1">
                          <IconPackage size={16} />
                          <span>{user.pedidos?.length || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <IconShoppingBag size={16} />
                          <span>{user.produtos?.length || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <IconStar size={16} />
                          <span>{user.avaliacoes?.length || 0}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm texto-azul">
                      {format(new Date(user.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {!user.isAdmin && (
                        <button
                          onClick={() => handleExcluirUsuario(user.id, user.nome)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title="Excluir usuário"
                        >
                          <IconTrash size={20} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

