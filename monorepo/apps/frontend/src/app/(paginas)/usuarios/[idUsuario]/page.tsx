"use client";
import CardSection from "@/components/template/CardSection";
import LogoAlt from "@/components/template/LogoAlt";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function Page() {
    const params = useParams();
    const idUsuario = params.idVendedor;

    return (
        <div className="bg-gray-100 text-black flex flex-col items-center gap-5">
            <LogoAlt />
            <div className="pl-25 p-5 w-full bg-white rounded-xl flex items-center gap-10">
                <div className="w-[120px] h-[120px] rounded-full overflow-hidden border-verde">
                    <Image src={"/foto-.jpg"} alt={"Foto de perfil do usuário"} width={50} height={50} className="object-cover w-full h-full" />
                </div>
                <div className="flex flex-col gap-y-2 items-start pt-5">
                    <p className="text-xl font-semibold texto-verde">Nome do brincante completo sera</p>
                    <p>(81) 99998-6022</p>
                    <p>luccabarros2003@gmail.com</p>
                    <p className="text-gray-400">Usuário desde 15 de Set de 2024</p>
                </div>
            </div>
            <div className="p-15 w-full bg-white rounded-xl">
                <div className="flex justify-between">
                    <h2 className="text-xl font-semibold texto-verde">Produtos do usuário</h2>
                    <Link href={`/mensagens/${idUsuario}`} className="botao-verde text-xl">Enviar Mensagem </Link>
                </div>
                <div className="px-15">
                    <CardSection />
                </div>
            </div>
        </div>
    )
};
