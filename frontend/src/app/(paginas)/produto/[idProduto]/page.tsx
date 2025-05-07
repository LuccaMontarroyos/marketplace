"use client";
import { useParams } from "next/navigation";
import Image from "next/image";
import LogoAlt from "@/components/template/LogoAlt";

export default function Page() {
    const params = useParams();
    const idProduto = params.idProduto;
    return (
        <div className="bg-gray-200 h-lvh">
            <LogoAlt />
            <div className="bg-white max-w-6xl mx-auto p-4 flex flex-col md:flex-row gap-8 mt-10">

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
                    <p>{idProduto}</p>
                    <p className="text-gray-600 mb-4">R$ 499,90</p>

                    <p className="text-gray-700 mb-6">
                        Tênis confortável para atividades físicas ou uso casual. Design moderno, disponível em várias cores.
                    </p>

                    <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition">
                        Adicionar ao Carrinho
                    </button>

                    {/* Outras infos opcionais */}
                    <div className="mt-8 border-t pt-4">
                        <h2 className="text-lg font-semibold mb-2">Informações adicionais</h2>
                        <ul className="list-disc list-inside text-gray-700">
                            <li>Tamanhos disponíveis: 38, 39, 40, 41, 42</li>
                            <li>Envio para todo o Brasil</li>
                            <li>Devolução gratuita em até 7 dias</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
