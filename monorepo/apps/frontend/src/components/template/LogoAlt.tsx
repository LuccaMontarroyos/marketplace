import Image from "next/image"
import Link from "next/link"
import { removerToken } from "@/utils/token";

export interface LogoAltProps {
    botaoSair?: boolean;
} 

export default function LogoAlt({botaoSair}: LogoAltProps) {
    return (
        <header className="bg-white w-full flex justify-between items-center pr-10">
            <Link href={"/"} >
                <Image src={"/LogoMarketplace2.png"} alt="Logo do Marketplace na cor verde" width={120} height={120} />
            </Link>
            {botaoSair ?? (<button onClick={() => removerToken()} className="botao-verde text-xl">Sair</button>)}
        </header>
    )
};
