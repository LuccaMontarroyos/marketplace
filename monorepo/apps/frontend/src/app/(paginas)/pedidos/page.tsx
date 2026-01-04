"use client";
import { useEffect, useState } from "react";
import { buscarPedidosDoComprador, Pedido } from "@/services/pedido";
import { toast } from "react-toastify";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { IconPackage, IconTruck, IconCheck, IconX } from "@tabler/icons-react";

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarPedidos();
  }, []);

  const carregarPedidos = async () => {
    try {
      setLoading(true);
      const dados = await buscarPedidosDoComprador();
      setPedidos(dados);
    } catch (error: any) {
      toast.error("Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDENTE":
        return <IconPackage className="text-yellow-500" size={24} />;
      case "PAGO":
        return <IconCheck className="text-blue-500" size={24} />;
      case "ENVIADO":
        return <IconTruck className="text-purple-500" size={24} />;
      case "ENTREGUE":
        return <IconCheck className="text-green-500" size={24} />;
      default:
        return <IconX className="text-red-500" size={24} />;
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl texto-azul">Carregando pedidos...</p>
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-gray-50">
        <IconPackage size={80} className="texto-verde mb-4" />
        <h2 className="text-2xl font-semibold mb-2 texto-azul">Nenhum pedido encontrado</h2>
        <p className="texto-azul opacity-70 mb-6 text-center">Você ainda não fez nenhum pedido</p>
        <Link href="/" className="botao-verde px-6 py-2 rounded-lg text-white">
          Explorar produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 texto-azul">Meus Pedidos</h1>
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
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-lg transition-shadow flex flex-col gap-4"
              >
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2 texto-azul">
                      Pedido #{pedido.id}
                    </h3>
                    <p className="texto-azul opacity-70 text-sm">
                      Data: {format(new Date(pedido.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(pedido.status)}
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                        pedido.status
                      )}`}
                    >
                      {getStatusText(pedido.status)}
                    </span>
                  </div>
                </div>

                <div className="mb-2">
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

                <div className="flex justify-between items-center pt-4 border-t flex-col gap-4 md:flex-row">
                  <div className="w-full md:w-auto">
                    <p className="text-sm texto-azul">
                      Entrega estimada:{" "}
                      {format(
                        new Date(pedido.dataEntregaEstimada),
                        "dd 'de' MMMM 'de' yyyy",
                        { locale: ptBR }
                      )}
                    </p>
                    {pagamento && (
                      <p className="text-sm texto-azul">
                        Pagamento: {pagamento.metodoPagamento} -{" "}
                        {pagamento.status}
                      </p>
                    )}
                  </div>
                  <div className="text-right w-full md:w-auto">
                    <p className="text-2xl font-bold texto-verde">
                      R$ {valorTotal.toFixed(2)}
                    </p>
                    <Link
                      href={`/pedidos/${pedido.id}`}
                      className="text-sm texto-verde hover:underline mt-2 inline-block"
                    >
                      Ver detalhes
                    </Link>
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

