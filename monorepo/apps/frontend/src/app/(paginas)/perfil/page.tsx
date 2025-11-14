"use client";
import LogoAlt from "@/components/template/LogoAlt";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useState } from "react";
import { IconEye, IconEyeOff, IconPencil } from "@tabler/icons-react";
import { atualizarUsuario, buscarUsuarioPorId, trocarSenha } from "@/services/usuario";
import { toast } from "react-toastify";

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
            alert("As senhas não coincidem.");
            return;
        }

        try {
            const resposta = await trocarSenha({ senhaAtual: senhaForm.senhaAtual, senhaNova: senhaForm.novaSenha });
            alert(resposta.message);
            setTrocandoSenha(false);
            setSenhaForm({
                senhaAtual: "",
                novaSenha: "",
                confirmaNovaSenha: "",
            })
            toast.success("Senha alterada com sucesso!");
        } catch (error: any) {
            toast.error("Erro ao alterar senha: ", error);
        }

    };

    return (
        <div className="min-h-lvh bg-gray-100 text-black flex flex-col items-center pb-10 gap-1">
            <LogoAlt botaoSair={true} />
            <div className="p-5 w-1/2 bg-white rounded-xl flex items-center justify-around mt-10">
                <div className="relative w-[180px] h-[180px] rounded-full overflow-hidden border-verde group">
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
                <div className="flex flex-col gap-y-5 items-start pt-5 w-2/3 text-black">
                    {editando ? (
                        <>
                            <input
                                className="border-b-1 border-gray-300 w-full"
                                value={dadosEditaveis.nome}
                                onChange={(e) =>
                                    setDadosEditaveis({ ...dadosEditaveis, nome: e.target.value })
                                }
                                placeholder="Nome"
                            />
                            <input
                                className="border-b-1 border-gray-300 w-full"
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
                                className="border-b-1 border-gray-300 w-full"
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
                                className="border-b-1 border-gray-300 w-full"
                                value={dadosEditaveis.cpf}
                                onChange={(e) =>
                                    setDadosEditaveis({
                                        ...dadosEditaveis,
                                        cpf: e.target.value,
                                    })
                                }
                                placeholder="border-b-1 border-gray-300 w-full"
                            />
                            <button className="botao-verde" onClick={handleEditarDados}>
                                Salvar alterações
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="flex flex-col gap-2">
                                <p className="text-xl font-bold">{usuario.nome}</p>
                                <p>{usuario.celular}</p>
                                <p>{usuario.email}</p>
                                <p>{usuario.cpf}</p>
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

                            <p className="text-gray-400">Usuário desde {dataFormatada}</p>
                        </>
                    )}

                    {trocandoSenha && (
                        <div className="flex flex-col gap-2 mt-4 w-full">
                            <div className="relative w-full">
                                <input
                                    className="input w-full pr-10"
                                    type={visivel.senhaAtual ? "text" : "password"}
                                    placeholder="Senha atual"
                                    value={senhaForm.senhaAtual}
                                    onChange={(e) =>
                                        setSenhaForm({ ...senhaForm, senhaAtual: e.target.value })
                                    }
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-2"
                                    onClick={() =>
                                        setVisivel({ ...visivel, senhaAtual: !visivel.senhaAtual })
                                    }
                                >
                                    {visivel.senhaAtual ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                                </button>

                            </div>

                            <div className="relative w-full">
                                <input
                                    className="input w-full pr-10"
                                    type={visivel.novaSenha ? "text" : "password"}
                                    placeholder="Nova senha"
                                    value={senhaForm.novaSenha}
                                    onChange={(e) =>
                                        setSenhaForm({ ...senhaForm, novaSenha: e.target.value })
                                    }
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-2"
                                    onClick={() =>
                                        setVisivel({ ...visivel, novaSenha: !visivel.novaSenha })
                                    }
                                >
                                    {visivel.novaSenha ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                                </button>
                            </div>
                            <div className="relative w-full">
                                <input
                                    className="input w-full pr-10"
                                    type={visivel.confirmaNovaSenha ? "text" : "password"}
                                    placeholder="Confirmar nova senha"
                                    value={senhaForm.confirmaNovaSenha}
                                    onChange={(e) =>
                                        setSenhaForm({ ...senhaForm, confirmaNovaSenha: e.target.value })
                                    }
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-2"
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
            <div className="bg-white flex gap-x-50 py-10 w-1/2 rounded-xl justify-center">
                <Link className="botao-verde" href={"/usuario/enderecos"}>
                    Endereços do usuário
                </Link>
                <Link className="botao-verde" href={"/usuario/produtos"}>
                    Produtos do usuário
                </Link>
            </div>

        </div>
    );
}
