import api from "./api";
import { DadosAtualizacaoUsuario, DadosTrocaSenha, Usuario } from "@/types/Usuario";
import { obterToken } from "@/utils/token";

export async function buscarUsuarioPorId(id: number): Promise<Usuario> {
  const tokenSalvo = obterToken();
  const { data } = await api.get<Usuario>(`/usuarios/${id}`, {
    headers: {
      Authorization: `Bearer ${tokenSalvo}`,
    },
  });

  return data;
}

export async function atualizarUsuario(id: number, dados: DadosAtualizacaoUsuario) {
  const tokenSalvo = obterToken();
  const response = await api.put(`/usuarios/${id}`, dados, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenSalvo}`,
    },
  });

  return response.data.usuario;

}

export async function trocarSenha(dados: DadosTrocaSenha) {
  const tokenSalvo = obterToken();

  const response = await api.put("usuarios/senha", dados, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenSalvo}`
    }
  });

  return response.data;
}