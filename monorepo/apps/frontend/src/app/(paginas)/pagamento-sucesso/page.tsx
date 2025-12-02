"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { buscarPedidoPorId } from "@/services/pedido";
import Link from "next/link";
import { Pedido } from "@/types/Pedido";

export default function PagamentoSucesso() {
  const searchParams = useSearchParams();
  const pedidoId = searchParams.get("pedidoId");
  const [pedido, setPedido] = useState<Pedido | null>(null);

  useEffect(() => {
    if (pedidoId) {
      buscarPedidoPorId(Number(pedidoId))
        .then((pedido: any) => setPedido(pedido))
        .catch((err: any) => console.error("Erro ao buscar pedido:", err));
    }
  }, [pedidoId]);

  if (!pedidoId) {
    return <p>Nenhum pedido informado.</p>;
  }

  return (
    <div className="flex flex-col items-center p-6 bg-white h-screen">
      <h1 className="text-2xl font-bold texto-verde">
        🎉 Pagamento confirmado!
      </h1>
      {pedido ? (
        <div className="mt-4 p-4 border rounded-md bg-gray-50 texto-azul">
          <p><strong>ID do Pedido:</strong> {pedido.id}</p>
          <p><strong>Status:</strong> {pedido.status}</p>
        </div>
      ) : (
        <p className="texto-azul">Carregando pedido...</p>
      )}
      <Link href="/" className="mt-6 texto-verde underline">
        Voltar para a loja
      </Link>
    </div>
  );
}
