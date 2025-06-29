import Image from "next/image";
import Link from "next/link";

export interface CardProps {
  idProduto: number;
  nome?: string;
  imagem?: string;
  idVendedor?: number;
  preco?: number;
  descricao?: string;
}

export default function Card(props: CardProps) {
  return (
    <Link href={props.idProduto ? `/produto/${props.idProduto}` : '/produto/1'}>
      <div className="bg-white shadow-md rounded-2xl overflow-hidden w-64 flex flex-col hover:shadow-xl transition-all duration-300">
        <Image
          className="object-cover rounded-2xl h-48 w-full"
          src={props.imagem ? props.imagem : "/imagem1.jpg"}
          alt={`Imagem do ${props.nome}`}
          width={250}
          height={200}
        />
        <div className="p-4 flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-gray-800">
            {props.nome ?? "Produto padrão"}
          </h2>
          <p className="text-sm text-gray-500 line-clamp-2">
            {props.descricao ?? "Produto de descrição genérica para exibição."}
          </p>
          <p className="text-md font-bold text-black">
            R$ {props.preco ?? "19.99"}
          </p>
        </div>
      </div>
    </Link>
  );
}

