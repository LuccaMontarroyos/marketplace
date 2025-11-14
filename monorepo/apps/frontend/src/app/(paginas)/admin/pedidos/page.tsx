"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import LogoAlt from "@/components/template/LogoAlt";
import { buscarPedidosDoComprador, Pedido } from "@/services/pedido";
import { toast } from "react-toastify";
import { IconPackage, IconTruck, IconCheck, IconX, IconEye } from "@tabler/icons-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

export default function AdminPedidosPage() {
  const { usuario } = useAuth();
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
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
    carregarPedidos();
  }, [usuario, router]);

  const carregarPedidos = async () => {
    try {
      setLoading(true);
      // Como admin, podemos buscar todos os pedidos
      // Por enquanto, vamos usar a mesma função, mas idealmente deveria ter uma rota específica
      const dados = await buscarPedidosDoComprador();
      setPedidos(dados);
    } catch (error: any) {
      toast.error("Erro ao carregar pedidos");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDENTE":
        return <IconPackage className="text-yellow-500" size={20} />;
      case "PAGO":
        return <IconCheck className="text-blue-500" size={20} />;
      case "ENVIADO":
        return <IconTruck className="text-purple-500" size={20} />;
      case "ENTREGUE":
        return <IconCheck className="text-green-500" size={20} />;
      default:
        return <IconX className="text-red-500" size={20} />;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDENTE: "Pendente",
      PAGO: "Pago",
      ENVIADO: "Enviado",
      ENTREGUE: "Entregue",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      PENDENTE: "bg-yellow-100 text-yellow-800",
      PAGO: "bg-blue-100 text-blue-800",
      ENVIADO: "bg-purple-100 text-purple-800",
      ENTREGUE: "bg-green-100 text-green-800",
    };
    return colorMap[status] || "bg-gray-100 text-gray-800";
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
          <p className="texto-azul text-lg">Carregando pedidos...</p>
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
            <h1 className="text-3xl font-bold texto-azul mb-2">Gerenciar Pedidos</h1>
            <p className="texto-azul opacity-70">
              Total de pedidos: {pedidos.length}
            </p>
          </div>
          <Link
            href="/admin"
            className="botao-verde px-4 py-2 rounded-lg text-white"
          >
            Voltar ao Painel
          </Link>
        </div>

        <div className="space-y-4">
          {pedidos.map((pedido) => {
            const valorTotal = pedido.PedidoProduto.reduce(
              (acc, item) => acc + Number(item.precoUnitario) * item.quantidade,
              0
            );
            const pagamento = pedido.Pagamento?.[0];

            return (
              <div
                key={pedido.id}
                className="bg-white rounded-lg shadow-md p-4 md:p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold mb-2 texto-azul">
                      Pedido #{pedido.id}
                    </h3>
                    <p className="text-sm texto-azul">
                      Data: {format(new Date(pedido.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                    {pedido.comprador && (
                      <p className="text-sm texto-azul">
                        Cliente: {pedido.comprador.nome} ({pedido.comprador.email})
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(pedido.status)}
                    <span
                      className={`px-3 py-1 rounded-full text-xs md:text-sm font-semibold ${getStatusColor(
                        pedido.status
                      )}`}
                    >
                      {getStatusText(pedido.status)}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold mb-2 texto-azul">Produtos:</h4>
                  <div className="space-y-2">
                    {pedido.PedidoProduto.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm texto-azul"
                      >
                        <span>
                          {item.produto?.nome || "Produto"} x {item.quantidade}
                        </span>
                        <span className="font-semibold">
                          R$ {(Number(item.precoUnitario) * item.quantidade).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 pt-4 border-t">
                  <div>
                    <p className="text-xs md:text-sm texto-azul">
                      Entrega estimada:{" "}
                      {format(
                        new Date(pedido.dataEntregaEstimada),
                        "dd 'de' MMMM 'de' yyyy",
                        { locale: ptBR }
                      )}
                    </p>
                    {pagamento && (
                      <p className="text-xs md:text-sm texto-azul">
                        Pagamento: {pagamento.metodoPagamento} - {pagamento.status}
                      </p>
                    )}
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-xl md:text-2xl font-bold texto-verde mb-2">
                      R$ {valorTotal.toFixed(2)}
                    </p>
                    <Link
                      href={`/pedidos/${pedido.id}`}
                      className="botao-verde px-4 py-2 rounded-lg text-white text-sm inline-flex items-center gap-2"
                    >
                      <IconEye size={18} />
                      Ver detalhes
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {pedidos.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="texto-azul text-lg">Nenhum pedido encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}

