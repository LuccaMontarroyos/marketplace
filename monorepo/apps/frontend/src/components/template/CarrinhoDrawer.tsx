"use client";
import { atualizarCarrinho, buscarProdutosDoCarrinho, removerProdutoDoCarrinho } from '@/services/carrinho';
import { ItemCarrinho } from '@/types/Carrinho';
import { IconXboxX } from '@tabler/icons-react';
import Image from "next/image";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface CarrinhoDrawerProps {
  aberto: boolean;
  onFechar: () => void;
  refresh?: boolean;
}

export default function CarrinhoDrawer({ aberto, onFechar, refresh }: CarrinhoDrawerProps) {

  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const buscarProdutos = async () => {
    setLoading(true);
    try {
      const produtosEncontrados = await buscarProdutosDoCarrinho();
      setItens(produtosEncontrados);
    } catch (error) {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  }

  const handleRemover = async (idProduto: number) => {
    try {
      await removerProdutoDoCarrinho(idProduto);
      setItens((prev) => prev.filter(item => item.idProduto !== idProduto));
    } catch (error) {
      // Error handled silently
    }
  }

  const handleAlterarQuantidade = async (idProduto: number, novaQuantidade: number) => {
    if (novaQuantidade < 1) return;
    try {
      const atualizado = await atualizarCarrinho(idProduto, novaQuantidade);
      setItens((prev) => prev.map(item => item.idProduto === idProduto ? { ...item, quantidade: atualizado.quantidade } : item));
    } catch (error) {
      // Error handled silently
    }
  };

  const total = itens.reduce((acc, item) => acc + Number(item.precoAtual) * item.quantidade, 0);

  useEffect(() => {
    if (aberto) {
      buscarProdutos();
    }
  }, [aberto])

  useEffect(() => {
    if(aberto && refresh !== undefined) {
      buscarProdutos();
    }
  }, [refresh])

  return (
    <div
      className={`fixed top-0 right-0 h-full w-80 text-black bg-white shadow-lg z-50 transition-transform duration-300 ${aberto ? "translate-x-0" : "translate-x-full"
        }`}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold texto-azul">Seu Carrinho</h2>
        <button onClick={onFechar} className="texto-azul hover:texto-verde text-xl font-bold">×</button>
      </div>

      {/* Corpo com scroll */}
      <div className="flex flex-col h-[calc(100%-64px)]"> {/* 64px = altura do header */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && <p className="texto-azul">Carregando itens...</p>}
          {!loading && itens.length === 0 && <p className="texto-azul text-center py-8">Seu carrinho está vazio</p>}

          <section className="flex flex-col gap-5">
            {itens.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between pb-5 border-b border-gray-200"
              >
                <Image
                  src={item.produto.imagens[0]?.url || "/defaultProduct.jpg"}
                  alt={item.produto.nome}
                  width={50}
                  height={50}
                  className='rounded'
                  unoptimized
                />
                <div className="flex-1 px-2">
                  <p className="font-medium texto-azul">{item.produto.nome}</p>
                  <p className="texto-verde font-semibold">R$ {Number(item.precoAtual).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleAlterarQuantidade(item.idProduto, item.quantidade - 1)}
                    disabled={item.quantidade <= 1}
                    className="border px-2 rounded disabled:opacity-50"
                    aria-label={`Diminuir quantidade de ${item.produto.nome}`}
                  >
                    -
                  </button>
                  <span className="px-2">{item.quantidade}</span>
                  <button
                    onClick={() => handleAlterarQuantidade(item.idProduto, item.quantidade + 1)}
                    className="border px-2 rounded"
                    aria-label={`Aumentar quantidade de ${item.produto.nome}`}
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => handleRemover(item.idProduto)}
                  aria-label={`Remover ${item.produto.nome} do carrinho`}
                  className="ml-2 text-red-600 hover:text-red-800"
                >
                  <IconXboxX size={20} />
                </button>
              </div>
            ))}
          </section>
        </div>

        {/* Rodapé fixo */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex justify-between mb-4 px-2">
            <p className="texto-azul font-semibold">TOTAL</p>
            <strong className="texto-verde text-xl">R$ {total.toFixed(2)}</strong>
          </div>
          <button onClick={()=> router.push("/pedido")} className="botao-verde w-full text-white py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed" disabled={itens.length === 0}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
