import { IconLockPassword, IconMail, IconUser } from "@tabler/icons-react";
import Link from "next/link";
import Image from "next/image";

export default function page() {
    return (
        <div className="login h-lvh">
            <Link href={"/"}><Image src={"/LogoMarketplace.png"} alt={"Logo do marketplace"} width={120} height={120} /></Link>
            <div className="flex items-center justify-center">

                <div className="flex flex-col">
                    <div className="self-center mb-5">
                        <IconUser size={90} className="rounded-full border-5" />
                    </div>
                    <h2 className="text-center text-xl mb-5">Entrar na sua conta</h2>

                    <div className="input-field">
                        <IconMail className="icon" size={20} />
                        <input className="" type="email" placeholder="Email" />
                    </div>
                    <div className="input-field">
                        <IconLockPassword className="icon" size={20} />
                        <input type="password" placeholder="Senha" />
                    </div>

                    <div className="flex gap-15 text-sm mb-10">
                        <label className=""><input type="checkbox" /> Lembrar-me</label>
                        <a href="#">Esqueceu a senha?</a>
                    </div>

                    <button className="botao py-2">Entrar</button>
                </div>

            </div>
        </div>
    )
};
