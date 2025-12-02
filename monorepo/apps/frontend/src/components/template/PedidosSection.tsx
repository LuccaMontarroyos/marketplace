"use client";
import { useEffect, useState } from "react";
import { buscarPedidosDoComprador, Pedido } from "@/services/pedido";
import { toast } from "react-toastify";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { IconPackage, IconTruck, IconCheck, IconX } from "@tabler/icons-react";

export default function PedidosSection() {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <p className="text-lg texto-azul">Carregando pedidos...</p>
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <IconPackage size={60} className="texto-verde mb-4" />
        <h2 className="text-xl font-semibold mb-2 texto-azul">Nenhum pedido encontrado</h2>
        <p className="texto-azul mb-6 text-center">Você ainda não fez nenhum pedido</p>
        <Link href="/" className="botao-verde px-6 py-2 rounded-lg text-white">
          Explorar produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-4 texto-azul">Meus Pedidos</h2>
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
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 hover:shadow-lg transition-shadow flex flex-col gap-4"
            >
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                <div>
                  <h3 className="text-lg md:text-xl font-semibold mb-2 texto-azul">
                    Pedido #{pedido.id}
                  </h3>
                  <p className="text-sm texto-azul">
                    Data: {format(new Date(pedido.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
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
                  <p className="text-xl md:text-2xl font-bold texto-verde">
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
  );
}

