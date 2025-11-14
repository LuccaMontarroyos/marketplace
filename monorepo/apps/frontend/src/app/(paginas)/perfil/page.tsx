"use client";
import LogoAlt from "@/components/template/LogoAlt";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useState } from "react";
import { IconEye, IconEyeOff, IconPencil, IconUser, IconHeart, IconPackage, IconShoppingBag } from "@tabler/icons-react";
import { atualizarUsuario, buscarUsuarioPorId, trocarSenha } from "@/services/usuario";
import { toast } from "react-toastify";
import FavoritosSection from "@/components/template/FavoritosSection";
import PedidosSection from "@/components/template/PedidosSection";
import PedidosVendedorSection from "@/components/template/PedidosVendedorSection";

export default function PerfilUsuario() {
    const { usuario } = useAuth();


    const [dadosEditaveis, setDadosEditaveis] = useState({
        nome: "",
        celular: "",
        email: "",
        cpf: "",
        fotoPerfil: "",
    });

    const [senhaForm, setSenhaForm] = useState({
        senhaAtual: "",
        novaSenha: "",
        confirmaNovaSenha: "",
    });

    const [visivel, setVisivel] = useState({
        senhaAtual: false,
        novaSenha: false,
        confirmaNovaSenha: false,
    })

    const [editando, setEditando] = useState(false);
    const [trocandoSenha, setTrocandoSenha] = useState(false);
    const [carregando, setCarregando] = useState(true);
    const [abaAtiva, setAbaAtiva] = useState<"perfil" | "favoritos" | "pedidos" | "pedidosVendedor">("perfil");

    useEffect(() => {
        const carregarDados = async () => {
            if (usuario) {
                try {
                    const dados = await buscarUsuarioPorId(usuario.id);
                    setDadosEditaveis({
                        nome: dados.nome,
                        celular: dados.celular,
                        email: dados.email,
                        cpf: dados.cpf,
                        fotoPerfil: dados.fotoPerfil || "",
                    });
                } catch (error) {
                    toast.error(`Erro ao buscar dados do usuário: ${error}`);
                } finally {
                    setCarregando(false);
                }
            }
        };
        carregarDados();
    }, [usuario]);

    if (!usuario || carregando) {
        return (
            <div className="bg-white h-lvh flex justify-center items-center">
                <p className="text-black">Carregando informações do usuário...</p>
            </div>
        );
    }

    const dataCriacao = new Date(usuario.createdAt);
    const dataFormatada = format(dataCriacao, "dd 'de' MMM 'de' yyyy", {
        locale: ptBR,
    });

    const handleEditarDados = async () => {
        try {
            const usuarioAtualizado = await atualizarUsuario(usuario.id, dadosEditaveis);

            setDadosEditaveis({
                nome: usuarioAtualizado.nome,
                celular: usuarioAtualizado.celular,
                email: usuarioAtualizado.email,
                cpf: usuarioAtualizado.cpf,
                fotoPerfil: usuarioAtualizado.fotoPerfil || "",
            });

            setEditando(false);
            toast.success("Dados atualizados com sucesso!");
        } catch (error) {
            toast.error("Erro ao atualizar dados do usuário:", error);
        }
    };

    const handleTrocarSenha = async () => {

        if (senhaForm.novaSenha !== senhaForm.confirmaNovaSenha) {
            toast.error("As senhas não coincidem.");
            return;
        }

        try {
            const resposta = await trocarSenha({ senhaAtual: senhaForm.senhaAtual, senhaNova: senhaForm.novaSenha });
            toast.success(resposta.message || "Senha alterada com sucesso!");
            setTrocandoSenha(false);
            setSenhaForm({
                senhaAtual: "",
                novaSenha: "",
                confirmaNovaSenha: "",
            })
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Erro ao alterar senha");
        }

    };

    return (
        <div className="min-h-lvh bg-gray-50 text-black flex flex-col items-center pb-10 gap-4">
            <LogoAlt botaoSair={true} />
            
            {/* Abas de navegação */}
            <div className="w-full max-w-6xl px-4 mt-6">
                <div className="flex flex-wrap gap-2 border-b border-gray-200">
                    <button
                        onClick={() => setAbaAtiva("perfil")}
                        className={`px-4 py-2 font-medium transition-colors ${
                            abaAtiva === "perfil"
                                ? "texto-verde border-b-2 border-verde"
                                : "texto-azul hover:texto-verde"
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <IconUser size={20} />
                            <span className="hidden sm:inline">Perfil</span>
                        </div>
                    </button>
                    <button
                        onClick={() => setAbaAtiva("favoritos")}
                        className={`px-4 py-2 font-medium transition-colors ${
                            abaAtiva === "favoritos"
                                ? "texto-verde border-b-2 border-verde"
                                : "texto-azul hover:texto-verde"
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <IconHeart size={20} />
                            <span className="hidden sm:inline">Favoritos</span>
                        </div>
                    </button>
                    <button
                        onClick={() => setAbaAtiva("pedidos")}
                        className={`px-4 py-2 font-medium transition-colors ${
                            abaAtiva === "pedidos"
                                ? "texto-verde border-b-2 border-verde"
                                : "texto-azul hover:texto-verde"
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <IconPackage size={20} />
                            <span className="hidden sm:inline">Meus Pedidos</span>
                        </div>
                    </button>
                    {usuario?.isVendedor && (
                        <button
                            onClick={() => setAbaAtiva("pedidosVendedor")}
                            className={`px-4 py-2 font-medium transition-colors ${
                                abaAtiva === "pedidosVendedor"
                                    ? "texto-verde border-b-2 border-verde"
                                    : "texto-azul hover:texto-verde"
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <IconShoppingBag size={20} />
                                <span className="hidden sm:inline">Pedidos Recebidos</span>
                            </div>
                        </button>
                    )}
                </div>
            </div>

            {/* Conteúdo das abas */}
            <div className="w-full max-w-6xl px-4">
                {abaAtiva === "perfil" && (
                    <div className="p-4 md:p-6 bg-white rounded-xl shadow-md">
                        <div className="flex flex-col md:flex-row items-center md:items-start justify-around gap-6">
                <div className="relative w-[150px] h-[150px] md:w-[180px] md:h-[180px] rounded-full overflow-hidden border-verde group">
                    <label htmlFor="inputFoto" className="cursor-pointer">
                        <Image
                            src={dadosEditaveis.fotoPerfil || usuario.fotoPerfil || "/icone-perfil.png"}
                            alt="Foto de perfil do usuário"
                            width={100}
                            height={100}
                            className="object-cover w-full h-full"
                        />
                        {editando && (
                            <div className="absolute inset-0 bg-verde bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-80 transition">
                                <IconPencil size={30} color="white" />
                            </div>
                        )}
                    </label>
                    {editando && (
                        <input
                            id="inputFoto"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;

                                const reader = new FileReader();
                                reader.onloadend = () => {
                                    const base64String = reader.result?.toString() || "";
                                    setDadosEditaveis((prev) => ({
                                        ...prev,
                                        fotoPerfil: base64String,
                                    }));
                                };
                                reader.readAsDataURL(file);
                            }}
                        />
                    )}
                </div>
                <div className="flex flex-col gap-y-5 items-start pt-5 w-full md:w-2/3 text-black">
                    {editando ? (
                        <>
                            <input
                                className="border-b-2 border-gray-300 w-full texto-azul placeholder:text-gray-400 focus:border-verde focus:outline-none"
                                value={dadosEditaveis.nome}
                                onChange={(e) =>
                                    setDadosEditaveis({ ...dadosEditaveis, nome: e.target.value })
                                }
                                placeholder="Nome"
                            />
                            <input
                                className="border-b-2 border-gray-300 w-full texto-azul placeholder:text-gray-400 focus:border-verde focus:outline-none"
                                value={dadosEditaveis.celular}
                                onChange={(e) =>
                                    setDadosEditaveis({
                                        ...dadosEditaveis,
                                        celular: e.target.value,
                                    })
                                }
                                placeholder="Celular"
                            />
                            <input
                                className="border-b-2 border-gray-300 w-full texto-azul placeholder:text-gray-400 focus:border-verde focus:outline-none"
                                value={dadosEditaveis.email}
                                onChange={(e) =>
                                    setDadosEditaveis({
                                        ...dadosEditaveis,
                                        email: e.target.value,
                                    })
                                }
                                placeholder="Email"
                            />
                            <input
                                className="border-b-2 border-gray-300 w-full texto-azul placeholder:text-gray-400 focus:border-verde focus:outline-none"
                                value={dadosEditaveis.cpf}
                                onChange={(e) =>
                                    setDadosEditaveis({
                                        ...dadosEditaveis,
                                        cpf: e.target.value,
                                    })
                                }
                                placeholder="CPF"
                            />
                            <button className="botao-verde" onClick={handleEditarDados}>
                                Salvar alterações
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="flex flex-col gap-2">
                                <p className="text-xl font-bold texto-azul">{usuario.nome}</p>
                                <p className="texto-azul">{usuario.celular}</p>
                                <p className="texto-azul">{usuario.email}</p>
                                <p className="texto-azul">{usuario.cpf}</p>
                            </div>
                            <div className="flex w-full justify-between gap-4">
                                <button
                                    className={`botao-verde ${trocandoSenha ? "opacity-50 cursor-not-allowed" : ""}`}
                                    onClick={() => setEditando(true)}
                                    disabled={trocandoSenha}
                                >
                                    Editar dados
                                </button>
                                {trocandoSenha ? (<button
                                    className={"botao-cinza rounded-md px-2"}
                                    onClick={() => setTrocandoSenha(false)}
                                    disabled={editando}
                                >
                                    Cancelar
                                </button>
                                ) : (
                                    <button
                                        className={`botao-verde ${editando ? "opacity-50 cursor-not-allowed" : ""}`}
                                        onClick={() => setTrocandoSenha(true)}
                                        disabled={editando}
                                    >
                                        Alterar senha
                                    </button>)}
                            </div>

                            <p className="texto-azul opacity-70">Usuário desde {dataFormatada}</p>
                        </>
                    )}

                    {trocandoSenha && (
                        <div className="flex flex-col gap-2 mt-4 w-full">
                            <div className="relative w-full">
                                <input
                                    className="input w-full pr-10 texto-azul placeholder:text-gray-400"
                                    type={visivel.senhaAtual ? "text" : "password"}
                                    placeholder="Senha atual"
                                    value={senhaForm.senhaAtual}
                                    onChange={(e) =>
                                        setSenhaForm({ ...senhaForm, senhaAtual: e.target.value })
                                    }
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-2 texto-azul"
                                    onClick={() =>
                                        setVisivel({ ...visivel, senhaAtual: !visivel.senhaAtual })
                                    }
                                >
                                    {visivel.senhaAtual ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                                </button>

                            </div>

                            <div className="relative w-full">
                                <input
                                    className="input w-full pr-10 texto-azul placeholder:text-gray-400"
                                    type={visivel.novaSenha ? "text" : "password"}
                                    placeholder="Nova senha"
                                    value={senhaForm.novaSenha}
                                    onChange={(e) =>
                                        setSenhaForm({ ...senhaForm, novaSenha: e.target.value })
                                    }
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-2 texto-azul"
                                    onClick={() =>
                                        setVisivel({ ...visivel, novaSenha: !visivel.novaSenha })
                                    }
                                >
                                    {visivel.novaSenha ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                                </button>
                            </div>
                            <div className="relative w-full">
                                <input
                                    className="input w-full pr-10 texto-azul placeholder:text-gray-400"
                                    type={visivel.confirmaNovaSenha ? "text" : "password"}
                                    placeholder="Confirmar nova senha"
                                    value={senhaForm.confirmaNovaSenha}
                                    onChange={(e) =>
                                        setSenhaForm({ ...senhaForm, confirmaNovaSenha: e.target.value })
                                    }
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-2 texto-azul"
                                    onClick={() =>
                                        setVisivel({ ...visivel, confirmaNovaSenha: !visivel.confirmaNovaSenha })
                                    }
                                >
                                    {visivel.confirmaNovaSenha ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                                </button>
                            </div>
                            <button className="botao-verde" onClick={handleTrocarSenha}>
                                Salvar nova senha
                            </button>
                        </div>
                    )}
                </div>
                    </div>
                    <div className="flex flex-wrap gap-4 justify-center mt-6 pt-6 border-t">
                        <Link className="botao-verde px-4 py-2 text-white rounded-lg" href={"/usuario/enderecos"}>
                            Endereços
                        </Link>
                        {usuario?.isVendedor && (
                            <Link className="botao-verde px-4 py-2 text-white rounded-lg" href={"/usuario/produtos"}>
                                Meus Produtos
                            </Link>
                        )}
                    </div>
                </div>
                )}

                {abaAtiva === "favoritos" && (
                    <div className="p-4 md:p-6 bg-white rounded-xl shadow-md">
                        <FavoritosSection />
                    </div>
                )}

                {abaAtiva === "pedidos" && (
                    <div className="p-4 md:p-6 bg-white rounded-xl shadow-md">
                        <PedidosSection />
                    </div>
                )}

                {abaAtiva === "pedidosVendedor" && usuario?.isVendedor && (
                    <div className="p-4 md:p-6 bg-white rounded-xl shadow-md">
                        <PedidosVendedorSection />
                    </div>
                )}
            </div>
        </div>
    );
}
