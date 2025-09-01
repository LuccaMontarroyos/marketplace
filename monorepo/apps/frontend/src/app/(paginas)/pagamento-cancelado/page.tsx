"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function PagamentoCancelado() {
  const searchParams = useSearchParams();
  const pedidoId = searchParams.get("pedidoId");

  return (
    <div className="flex flex-col items-center p-6 h-screen bg-white texto-azul">
      <h1 className="text-2xl font-bold">
        ✖️ Pagamento cancelado
      </h1>
      <p className="mt-2">
        Seu pedido {pedidoId ? `#${pedidoId}` : ""} não foi concluído.
      </p>
      <Link href="/" className="mt-6 texto-verde underline">
        Voltar para o carrinho
      </Link>
    </div>
  );
}
