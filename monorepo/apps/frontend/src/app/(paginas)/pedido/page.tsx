"use client";

import LogoAlt from "@/components/template/LogoAlt";
import { buscarProdutosDoCarrinho } from "@/services/carrinho";
import { buscarEnderecosDoUsuario } from "@/services/endereco";
import { criarPedido } from "@/services/pedido";
import { ItemCarrinho } from "@/types/Carrinho";
import { Endereco } from "@/types/Endereco";
import Link from "next/link";
import { useEffect, useState } from "react";
// import { criarPedido } from "@/services/pedidoService";

type MetodoPagamento = "pix" | "boleto" | "cartao";

export default function Page() {
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [enderecoSelecionado, setEnderecoSelecionado] = useState<Endereco>();
  const [metodoPagamento, setMetodoPagamento] = useState<MetodoPagamento>("pix");
  const [tipoEnvio, setTipoEnvio] = useState<"normal" | "expresso">("normal");
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
    (acc, item) => acc + Number(item.produto.preco) * item.quantidade,
    0
  );

  const handleConfirmarPedido = async () => {
    if (!enderecoSelecionado) {
      alert("Selecione ou cadastre um endereço!");
      return;
    }

    setLoading(true);
    try {
      const pedido = await criarPedido(metodoPagamento, enderecoSelecionado.id, tipoEnvio);
      window.location.href = pedido.checkoutUrl;
      alert("Pedido criado com sucesso!");
    } catch (err) {
      console.log(metodoPagamento);
      console.log(enderecoSelecionado.id);
      console.log(tipoEnvio);
      
      console.error(err);
      alert("Erro ao criar pedido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen texto-verde pb-10">
      <LogoAlt botaoSair={false} />
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl mx-auto p-5 space-y-6">
        <h1 className="text-2xl font-bold">Finalizar Pedido</h1>


        <div className="bg-white p-4 rounded-2xl shadow">
          <h2 className="text-lg font-semibold mb-2">Itens do Carrinho</h2>
          {carrinho.map((item) => (
            <div key={item.id} className="flex justify-between border-b py-2">
              <span>{item.produto.nome} (x{item.quantidade})</span>
              <span>R$ {(Number(item.produto.preco) * item.quantidade).toFixed(2)}</span>
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
              value={enderecoSelecionado?.id}
              onChange={(e) => setEnderecoSelecionado(enderecos.find(end => end.id === Number(e.target.value)))}
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
              Nenhum endereço cadastrado. <Link className="text-blue-500 underline hover:text-blue-950" href={"/usuario/enderecos"}>Cadastrar</Link>
            </p>
          )}
        </div>

        {/* Pagamento */}
        <div className="bg-white p-4 rounded-2xl shadow">
          <h2 className="text-lg font-semibold mb-2">Forma de Pagamento</h2>
          <div className="flex gap-4">
            {[/*"pix",*/ "boleto", "cartao"].map((opcao) => (
              <label key={opcao} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="pagamento"
                  value={opcao}
                  checked={metodoPagamento === opcao}
                  onChange={() => setMetodoPagamento(opcao as MetodoPagamento)}
                />
                {opcao.toUpperCase()}
              </label>
            ))}
          </div>
          <h2 className="text-lg font-semibold mt-5 mb-2">Tipo de Envio</h2>
          <div>
            <select value={tipoEnvio} onChange={(e) => setTipoEnvio(e.target.value as "normal" | "expresso")} className="border rounded p-2" name="tipoEnvio" id="tipoEnvio">
              <option value="normal">Normal (prazo: 12 dias)</option>
              <option value="expresso">Expresso (prazo: 5 dias)</option>
            </select>
          </div>
        </div>

        {/* Confirmar */}
        <button
          onClick={handleConfirmarPedido}
          disabled={loading}
          className="w-full botao-azul text-white py-3 rounded-2xl shadow"
        >
          {loading ? "Processando..." : "Confirmar Pedido"}
        </button>
      </div>
    </div>
  );
}
