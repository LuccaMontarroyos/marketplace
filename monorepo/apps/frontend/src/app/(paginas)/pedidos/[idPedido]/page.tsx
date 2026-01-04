"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { buscarPedidoPorId, cancelarPedido, refazerPedido, Pedido } from "@/services/pedido";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { IconPackage, IconTruck, IconCheck, IconX, IconRefresh } from "@tabler/icons-react";
import Link from "next/link";
import Image from "next/image";

export default function DetalhesPedidoPage() {
  const params = useParams();
  const router = useRouter();
  const idPedido = Number(params.idPedido);
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (idPedido) {
      carregarPedido();
    }
  }, [idPedido]);

  const carregarPedido = async () => {
    try {
      setLoading(true);
      const dados = await buscarPedidoPorId(idPedido);
      setPedido(dados);
    } catch (error: any) {
      toast.error("Erro ao carregar pedido");
      router.push("/pedidos");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarPedido = async () => {
    if (!window.confirm("Tem certeza que deseja cancelar este pedido?")) {
      return;
    }

    try {
      await cancelarPedido(idPedido);
      toast.success("Pedido cancelado com sucesso");
      router.push("/pedidos");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao cancelar pedido");
    }
  };

  const handleRefazerPedido = async () => {
    try {
      await refazerPedido(idPedido);
      toast.success("Produtos adicionados ao carrinho!");
      router.push("/");
    } catch (error: any) {
      toast.error("Erro ao refazer pedido");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDENTE":
        return <IconPackage className="text-yellow-500" size={32} />;
      case "PAGO":
        return <IconCheck className="text-blue-500" size={32} />;
      case "ENVIADO":
        return <IconTruck className="text-purple-500" size={32} />;
      case "ENTREGUE":
        return <IconCheck className="text-green-500" size={32} />;
      default:
        return <IconX className="text-red-500" size={32} />;
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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Carregando pedido...</p>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Pedido não encontrado</p>
      </div>
    );
  }

  const valorTotal = pedido.PedidoProduto.reduce(
    (acc, item) => acc + Number(item.precoUnitario) * item.quantidade,
    0
  );
  const pagamento = pedido.Pagamento?.[0];
  const podeCancelar = pedido.status === "PENDENTE" || pedido.status === "PAGO";

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/pedidos" className="texto-verde hover:underline">
            ← Voltar para pedidos
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Pedido #{pedido.id}</h1>
              <p className="text-gray-600">
                Data: {format(new Date(pedido.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {getStatusIcon(pedido.status)}
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(
                  pedido.status
                )}`}
              >
                {getStatusText(pedido.status)}
              </span>
            </div>
          </div>

          {pagamento && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Informações de Pagamento</h3>
              <p className="text-sm">
                <span className="font-semibold">Método:</span> {pagamento.metodoPagamento}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Status:</span> {pagamento.status}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Valor:</span> R$ {pagamento.valor.toFixed(2)}
              </p>
            </div>
          )}

          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-4">Produtos</h3>
            <div className="space-y-4">
              {pedido.PedidoProduto.map((item) => {
                const imagem = item.produto?.imagens?.[0]?.url || "/defaultProduct.jpg";
                return (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 border rounded-lg"
                  >
                    <Link href={`/produto/${item.produto?.id}`}>
                      <div className="relative w-24 h-24">
                        <Image
                          src={imagem}
                          alt={item.produto?.nome || "Produto"}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                    </Link>
                    <div className="flex-1">
                      <Link href={`/produto/${item.produto?.id}`}>
                        <h4 className="font-semibold hover:texto-verde">
                          {item.produto?.nome || "Produto"}
                        </h4>
                      </Link>
                      <p className="text-sm text-gray-600">
                        Quantidade: {item.quantidade}
                      </p>
                      <p className="text-sm text-gray-600">
                        Preço unitário: R$ {Number(item.precoUnitario).toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold texto-verde">
                        R$ {(Number(item.precoUnitario) * item.quantidade).toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold">Total:</span>
              <span className="text-3xl font-bold texto-verde">
                R$ {valorTotal.toFixed(2)}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Entrega estimada:{" "}
              {format(
                new Date(pedido.dataEntregaEstimada),
                "dd 'de' MMMM 'de' yyyy",
                { locale: ptBR }
              )}
            </p>

            <div className="flex gap-4">
              {podeCancelar && (
                <button
                  onClick={handleCancelarPedido}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Cancelar Pedido
                </button>
              )}
              <button
                onClick={handleRefazerPedido}
                className="px-4 py-2 botao-verde rounded-lg flex items-center gap-2"
              >
                <IconRefresh size={20} />
                Refazer Pedido
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

