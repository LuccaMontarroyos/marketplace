"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
// import { buscarPedidoPorId } from "@/services/pedidos";
import Link from "next/link";
import { Pedido } from "@/types/Pedido";

export default function PagamentoSucesso() {
  const searchParams = useSearchParams();
  const pedidoId = searchParams.get("pedidoId");
  const [pedido, setPedido] = useState<Pedido>();

  useEffect(() => {
    if (pedidoId) {
    //   buscarPedidoPorId(Number(pedidoId))
        // .then(setPedido)
        // .catch((err) => console.error("Erro ao buscar pedido:", err));
    }
  }, [pedidoId]);

  if (!pedidoId) {
    return <p>Nenhum pedido informado.</p>;
  }

  return (
    <div className="flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold text-green-600">
        🎉 Pagamento confirmado!
      </h1>
      {pedido ? (
        <div className="mt-4 p-4 border rounded-md bg-gray-50">
          <p><strong>ID do Pedido:</strong> {pedido.id}</p>
          <p><strong>Status:</strong> {pedido.status}</p>
          <p><strong>Total:</strong> R$ {pedido.total}</p>
        </div>
      ) : (
        <p>Carregando pedido...</p>
      )}
      <Link href="/" className="mt-6 text-blue-600 underline">
        Voltar para a loja
      </Link>
    </div>
  );
}
