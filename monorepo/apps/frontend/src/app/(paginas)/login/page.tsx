"use client";
import { IconLockPassword, IconMail, IconUser } from "@tabler/icons-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from 'react';
import { loginUsuario } from "@/services/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Page() {

    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");

    const router = useRouter();
    const searchParams = useSearchParams();
    const { setToken } = useAuth();

    const handleLogin = async () => {
        if (!email || !senha) {
            alert("Preencha todos os campos");
            return;
        }

        try {
            const usuarioLogado = {
                email: email,
                senha: senha,
            }
            const resposta = await loginUsuario(usuarioLogado);

            if (resposta.token) {
                await setToken(resposta.token);
                
                const redirectTo = searchParams.get("from") || "/";
                router.push(redirectTo);
            }
            
        } catch (error: any) {
            const mensagem = error.response?.data?.message || "Erro ao fazer login. Tente novamente.";
            alert(mensagem);
        }
    };


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
                        <input onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" />
                    </div>
                    <div className="input-field">
                        <IconLockPassword className="icon" size={20} />
                        <input onChange={(e) => setSenha(e.target.value)} type="password" placeholder="Senha" />
                    </div>

                    <div className="flex gap-15 text-sm mb-10">
                        <label className=""><input type="checkbox" />Lembrar-me</label>
                        <a href="#">Esqueceu a senha?</a>
                    </div>

                    <button className="botao py-2" onClick={handleLogin}>Entrar</button>
                </div>

            </div>
        </div>
    )
};
