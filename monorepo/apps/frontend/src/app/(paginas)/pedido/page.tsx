"use client";

import LogoAlt from "@/components/template/LogoAlt";
import { buscarProdutosDoCarrinho } from "@/services/carrinho";
import { buscarEnderecosDoUsuario } from "@/services/endereco";
import { criarPedido } from "@/services/pedido";
import { ItemCarrinho } from "@/types/Carrinho";
import { Endereco } from "@/types/Endereco";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

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
      toast.error("Selecione ou cadastre um endereço!");
      return;
    }

    if (carrinho.length === 0) {
      toast.error("Seu carrinho está vazio!");
      return;
    }

    setLoading(true);
    try {
      const pedido = await criarPedido(metodoPagamento, enderecoSelecionado.id, tipoEnvio);
      toast.success("Redirecionando para o pagamento...");
      window.location.href = pedido.checkoutUrl;
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao criar pedido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      <LogoAlt botaoSair={false} />
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl mx-auto p-5 md:p-8 space-y-6 mt-6">
        <h1 className="text-2xl md:text-3xl font-bold texto-azul">Finalizar Pedido</h1>


        <div className="bg-gray-50 p-4 md:p-6 rounded-2xl shadow">
          <h2 className="text-lg font-semibold mb-4 texto-azul">Itens do Carrinho</h2>
          {carrinho.map((item) => (
            <div key={item.id} className="flex justify-between border-b border-gray-200 py-3">
              <span className="texto-azul">{item.produto.nome} (x{item.quantidade})</span>
              <span className="texto-verde font-semibold">R$ {(Number(item.produto.preco) * item.quantidade).toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold pt-4 mt-2">
            <span className="texto-azul text-lg">Total:</span>
            <span className="texto-verde text-xl">R$ {total.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-gray-50 p-4 md:p-6 rounded-2xl shadow">
          <h2 className="text-lg font-semibold mb-4 texto-azul">Endereço de Entrega</h2>
          {enderecos.length > 0 ? (
            <select
              value={enderecoSelecionado?.id}
              onChange={(e) => setEnderecoSelecionado(enderecos.find(end => end.id === Number(e.target.value)))}
              className="border border-gray-300 rounded-lg p-2 w-full texto-azul focus:border-verde focus:outline-none"
            >
              {enderecos.map((end) => (
                <option key={end.id} value={end.id}>
                  {end.logradouro}, {end.numero} - {end.cidade}/{end.estado}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm texto-azul">
              Nenhum endereço cadastrado. <Link className="link-perfil underline hover:texto-verde" href={"/usuario/enderecos"}>Cadastrar</Link>
            </p>
          )}
        </div>

        <div className="bg-gray-50 p-4 md:p-6 rounded-2xl shadow">
          <h2 className="text-lg font-semibold mb-4 texto-azul">Forma de Pagamento</h2>
          <div className="flex flex-wrap gap-4">
            {["boleto", "cartao"].map((opcao) => (
              <label key={opcao} className="flex items-center gap-2 cursor-pointer texto-azul">
                <input
                  type="radio"
                  name="pagamento"
                  value={opcao}
                  checked={metodoPagamento === opcao}
                  onChange={() => setMetodoPagamento(opcao as MetodoPagamento)}
                  className="accent-verde"
                />
                {opcao.toUpperCase()}
              </label>
            ))}
          </div>
          <h2 className="text-lg font-semibold mt-5 mb-4 texto-azul">Tipo de Envio</h2>
          <div>
            <select value={tipoEnvio} onChange={(e) => setTipoEnvio(e.target.value as "normal" | "expresso")} className="border border-gray-300 rounded-lg p-2 texto-azul focus:border-verde focus:outline-none" name="tipoEnvio" id="tipoEnvio">
              <option value="normal">Normal (prazo: 12 dias)</option>
              <option value="expresso">Expresso (prazo: 5 dias)</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleConfirmarPedido}
          disabled={loading}
          className="w-full botao-verde text-white py-3 rounded-2xl shadow hover:bg-azul transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Processando..." : "Confirmar Pedido"}
        </button>
      </div>
    </div>
  );
}
