import LogoAlt from "@/components/template/LogoAlt";
import Image from "next/image";

export default function PerfilUsuario() {
    return (
        <div className="h-lvh bg-gray-100 text-black flex flex-col items-center gap-5">
            <LogoAlt />
            <div className="p-5 w-1/2 bg-white rounded-xl flex items-center justify-around">
                <div className="w-[150px] h-[150px] rounded-full overflow-hidden">
                    <Image src={"/foto-.jpg"} alt={"Foto de perfil do usuário"} width={100} height={100} className="object-cover w-full h-full" />
                </div>
                <div className="flex flex-col gap-y-5 items-start pt-5">
                    <p>Nome do brincante completo sera</p>
                    <p>(81) 99998-6022</p>
                    <p>luccabarros2003@gmail.com</p>
                    <p>108.964.854-55</p>
                    <button className="botao-verde">Editar dados</button>
                    <button className="botao-verde">Alterar senha</button>
                    <p className="text-gray-400">Usuário desde 15 de setembro de 2024</p>
                </div>
            </div>
            <div className="flex gap-x-50 pt-10">
                <button className="botao-verde">Endereços do usuário</button>
                <button className="botao-verde">Produtos do usuário</button>
            </div>
        </div>
    )
};
