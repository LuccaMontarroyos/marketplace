"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function PagamentoCancelado() {
  const searchParams = useSearchParams();
  const pedidoId = searchParams.get("pedidoId");

  return (
    <div className="flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold text-red-600">
        ❌ Pagamento cancelado
      </h1>
      <p className="mt-2">
        Seu pedido {pedidoId ? `#${pedidoId}` : ""} não foi concluído.
      </p>
      <Link href="/carrinho" className="mt-6 text-blue-600 underline">
        Voltar para o carrinho
      </Link>
    </div>
  );
}
