"use client";
import { useParams } from "next/navigation";
import Image from "next/image";
import LogoAlt from "@/components/template/LogoAlt";
import Link from "next/link";

export default function Page() {
    const params = useParams();
    const idProduto = params.idProduto;
    const idVendedor = 1;
    return (
        <div className="bg-gray-200 h-lvh text-black">
            <LogoAlt />
            <div className="py-15 bg-white max-w-6xl mx-auto p-4 flex flex-col md:flex-row gap-8 mt-10 rounded-md">

                <div className="flex flex-col md:flex-row gap-4">

                    <div className="flex md:flex-col gap-2">
                        {[1, 2, 3].map((_, index) => (
                            <Image
                                key={index}
                                src="/imagem1.jpg"
                                alt={`Miniatura ${index + 1}`}
                                width={80}
                                height={80}
                                className="object-cover rounded-md border cursor-pointer"
                            />
                        ))}
                    </div>

                    {/* Imagem principal */}
                    <Image
                        src="/imagem2.jpg"
                        alt="Imagem principal"
                        width={500}
                        height={500}
                        className="object-cover rounded-lg"
                    />
                </div>

                <div className="flex-1">
                    <h1 className="text-3xl font-bold mb-2">Tênis Nike Air Max</h1>
                    <p className="font-semibold mb-4">R$ 499,90</p>

                    <p className="text-gray-700 mb-6">
                        Tênis confortável para atividades físicas ou uso casual. Design moderno, disponível em várias cores.
                    </p>

                    <button className=" text-white px-6 py-2 rounded 
                    add-carrinho transition">
                        Adicionar ao Carrinho
                    </button>

                    {/* Outras infos opcionais */}
                    <div className="mt-8 border-t border-gray-300 pt-4">
                        <h2 className="text-lg font-semibold mb-2">Informações adicionais</h2>
                        <ul className="list-disc list-inside text-gray-700">
                            <li>Quantidade em estoque: </li>
                            <li>Tipo do produto: </li>
                            <li>Produto postado em 23 de Nov de 2023</li>
                            <li>Vendido por <Link href={`/usuarios/${idVendedor}`} className="link-perfil">Elieser Macedo</Link></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
