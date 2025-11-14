"use client";
import CardSection from "@/components/template/CardSection";
import LogoAlt from "@/components/template/LogoAlt";
import { buscarUsuarioPorId } from "@/services/usuario";
import { Usuario } from "@/types/Usuario";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
    const params = useParams();
    const idUsuario = params.idUsuario;
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        const carregarUsuario = async () => {
            try {
                const dados = await buscarUsuarioPorId(Number(idUsuario));
                setUsuario(dados);
            } catch (error) {
                console.error("Erro ao buscar usuário:", error);
            } finally {
                console.log("caindo aqui")
                setCarregando(false);
            }
        };
        if (idUsuario) carregarUsuario();
    }, [idUsuario]);

    if (carregando) {
        return (
            <div className="bg-gray-100 h-lvh flex justify-center items-center text-black">
                Carregando perfil...
            </div>
        );
    }

    if (!usuario) {
        return (
            <div className="bg-gray-100 h-lvh flex justify-center items-center text-black">
                Usuário não encontrado.
            </div>
        );
    }

    return (
        <div className="bg-gray-100 text-black flex flex-col items-center gap-5">
            <LogoAlt />
            <div className="pl-25 p-5 w-full bg-white rounded-xl flex items-center gap-10">
                <div className="w-[120px] h-[120px] rounded-full overflow-hidden border-verde">
                    <Image src={usuario.fotoPerfil || "/icone-perfil.png"} alt={"Foto de perfil do usuário"} width={50} height={50} className="object-cover w-full h-full" />
                </div>
                <div className="flex flex-col gap-y-2 items-start pt-5">
                    <p className="text-xl font-semibold texto-verde">{usuario.nome}</p>
                    <p>{usuario.celular}</p>
                    <p>{usuario.email}</p>
                    <p className="text-gray-400">Usuário desde {new Date(usuario.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}</p>
                </div>
            </div>
            <div className="p-15 w-full bg-white rounded-xl">
                <div className="flex justify-between">
                    <h2 className="text-xl font-semibold texto-verde">Produtos do usuário</h2>
                    <Link href={`/mensagens/${idUsuario}`} className="botao-verde text-xl">Enviar Mensagem </Link>
                </div>
                <div className="px-15">
                    <CardSection idUsuario={Number(idUsuario)}/>
                </div>
            </div>
        </div>
    )
};
