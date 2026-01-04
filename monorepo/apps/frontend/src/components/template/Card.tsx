import Image from "next/image";
import Link from "next/link";
import { IconShoppingCartPlus } from "@tabler/icons-react";
import { adicionarAoCarrinho } from "@/services/carrinho";
import { toast } from "react-toastify";

export interface CardProps {
  idProduto: number;
  nome?: string;
  imagem?: string;
  idVendedor?: number;
  preco?: number;
  descricao?: string;
  onAddCarrinho?: () => void;
}

export default function Card({ nome, idProduto, imagem, descricao, preco, onAddCarrinho }: CardProps) {
  const handleAddShoppingCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await adicionarAoCarrinho(idProduto, 1);
      if(onAddCarrinho) onAddCarrinho();
    } catch (error) {
      toast.error("Erro ao atualizar carrinho");
    }
  } 

  return (
    <Link href={idProduto ? `/produto/${idProduto}` : '/produto/1'}>
      <div className="bg-white shadow-md rounded-2xl overflow-hidden w-full max-w-64 flex flex-col hover:shadow-xl transition-all duration-300 h-full">
        <div className="relative h-48 w-full flex-shrink-0">
          <Image
            className="object-cover rounded-t-2xl w-full h-full"
            src={imagem ? imagem : "/defaultProduct.jpg"}
            alt={`Imagem do ${nome}`}
            fill
            unoptimized
          />
        </div>
        <div className="p-4 flex flex-col gap-2 flex-grow">
          <h2 className="text-lg font-semibold texto-azul line-clamp-2 min-h-[3.5rem]">
            {nome ?? "Produto padrão"}
          </h2>
          <p className="text-sm texto-azul opacity-70 line-clamp-2 flex-grow">
            {descricao ?? "Produto de descrição genérica para exibição."}
          </p>
          <div className="flex w-full justify-between items-center mt-auto">
            <p className="text-md font-bold texto-verde">
              R$ {Number(preco).toFixed(2) ?? "0.00"}
            </p>
            <button onClick={handleAddShoppingCart} className="rounded-full bg-verde p-2 text-white hover:bg-azul transition-colors"><IconShoppingCartPlus size={20} /></button>
          </div>
        </div>
      </div>
    </Link>
  );
}

