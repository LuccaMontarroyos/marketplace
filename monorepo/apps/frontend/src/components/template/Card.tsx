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
  console.log(imagem);
  const handleAddShoppingCart = async (e: React.MouseEvent) => {
    e.preventDefault();

    
    try {
      console.log("a porra ta caindo aqui");
      await adicionarAoCarrinho(idProduto, 1);
      if(onAddCarrinho) onAddCarrinho();
    } catch (error) {
      console.error("Erro ao atualizar carrinho: ", error);
      toast.error("Erro ao atualizar carrinho");
    }
  } 

  return (
    <Link href={idProduto ? `/produto/${idProduto}` : '/produto/1'}>
      <div className="bg-white shadow-md rounded-2xl overflow-hidden w-64 flex flex-col hover:shadow-xl transition-all duration-300">
        <Image
          className="object-cover rounded-2xl h-48 w-full"
          src={imagem ? imagem : "/imagem1.jpg"}
          alt={`Imagem do ${nome}`}
          width={250}
          height={200}
          unoptimized
        />
        <div className="p-4 flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-gray-800">
            {nome ?? "Produto padrão"}
          </h2>
          <p className="text-sm text-gray-500 line-clamp-2">
            {descricao ?? "Produto de descrição genérica para exibição."}
          </p>
          <div className="flex w-full justify-between">
            <p className="text-md font-bold text-black">
              R$ {Number(preco).toFixed(2) ?? "0.00"}
            </p>
            <button onClick={handleAddShoppingCart} className="rounded-full bg-verde p-2"><IconShoppingCartPlus size={20} /></button>
          </div>
        </div>
      </div>
    </Link>
  );
}

