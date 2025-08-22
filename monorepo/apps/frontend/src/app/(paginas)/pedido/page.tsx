"use client";

import { buscarProdutosDoCarrinho } from "@/services/carrinho";
import { buscarEnderecosDoUsuario } from "@/services/endereco";
import { useEffect, useState } from "react";
// import { criarPedido } from "@/services/pedidoService";

export default function Page() {
  const [carrinho, setCarrinho] = useState<any[]>([]);
  const [enderecos, setEnderecos] = useState<any[]>([]);
  const [enderecoSelecionado, setEnderecoSelecionado] = useState<any>();
  const [pagamento, setPagamento] = useState<"pix" | "boleto" | "cartao">("pix");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const carregar = async () => {
      const produtos = await buscarProdutosDoCarrinho();
      setCarrinho(produtos);

      const enderecosUser = await buscarEnderecosDoUsuario();
      setEnderecos(enderecosUser);
      if (enderecosUser.length > 0) {
        setEnderecoSelecionado(enderecosUser[0]);
      }
    };
    carregar();
  }, []);

  const total = carrinho.reduce(
    (acc, item) => acc + item.preco * item.quantidade,
    0
  );

  const handleConfirmarPedido = async () => {
    if (!enderecoSelecionado) {
      alert("Selecione ou cadastre um endereço!");
      return;
    }

    setLoading(true);
    try {
    //   const pedido = await criarPedido({
    //     metodoDePagamento: pagamento,
    //     enderecoId: enderecoSelecionado,
    //   });

      if (pagamento === "cartao") {
        // redirecionar para Stripe Checkout se necessário
        // window.location.href = pedido.checkoutUrl;
      } else {
        alert("Pedido criado com sucesso!");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao criar pedido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Finalizar Pedido</h1>

      {/* Itens do carrinho */}
      <div className="bg-white p-4 rounded-2xl shadow">
        <h2 className="text-lg font-semibold mb-2">Itens do Carrinho</h2>
        {carrinho.map((item) => (
          <div key={item.id} className="flex justify-between border-b py-2">
            <span>{item.nome} (x{item.quantidade})</span>
            <span>R$ {(item.preco * item.quantidade).toFixed(2)}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold pt-2">
          <span>Total:</span>
          <span>R$ {total.toFixed(2)}</span>
        </div>
      </div>

      {/* Endereço */}
      <div className="bg-white p-4 rounded-2xl shadow">
        <h2 className="text-lg font-semibold mb-2">Endereço de Entrega</h2>
        {enderecos.length > 0 ? (
          <select
            value={enderecoSelecionado}
            onChange={(e) => setEnderecoSelecionado(e.target.value)}
            className="border rounded p-2 w-full"
          >
            {enderecos.map((end) => (
              <option key={end.id} value={end.id}>
                {end.logradouro}, {end.numero} - {end.cidade}/{end.estado}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-sm text-gray-500">
            Nenhum endereço cadastrado. <button className="text-blue-500 underline">Cadastrar</button>
          </p>
        )}
      </div>

      {/* Pagamento */}
      <div className="bg-white p-4 rounded-2xl shadow">
        <h2 className="text-lg font-semibold mb-2">Forma de Pagamento</h2>
        <div className="flex gap-4">
          {["pix", "boleto", "cartao"].map((opcao) => (
            <label key={opcao} className="flex items-center gap-2">
              <input
                type="radio"
                name="pagamento"
                value={opcao}
                checked={pagamento === opcao}
                onChange={() => setPagamento(opcao as any)}
              />
              {opcao.toUpperCase()}
            </label>
          ))}
        </div>
      </div>

      {/* Confirmar */}
      <button
        onClick={handleConfirmarPedido}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-2xl shadow hover:bg-blue-700"
      >
        {loading ? "Processando..." : "Confirmar Pedido"}
      </button>
    </div>
  );
}
