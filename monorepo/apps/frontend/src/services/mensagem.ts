import { obterToken } from "@/utils/token";
import api from "./api";

export interface Mensagem {
  id: number;
  idUsuarioEmissor: number;
  idUsuarioReceptor: number;
  mensagem: string;
  dataEnvio: Date;
  usuarioEmissor?: {
    id: number;
    nome: string;
    email: string;
  };
  usuarioReceptor?: {
    id: number;
    nome: string;
    email: string;
  };
}

export interface DadosMensagem {
  idUsuarioReceptor: number;
  mensagem: string;
}

export async function enviarMensagem(dados: DadosMensagem) {
  const token = obterToken();
  const response = await api.post<{ message: string; mensagemEnviada: Mensagem }>(
    "/mensagens",
    dados,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
}

export async function buscarMensagens(): Promise<Mensagem[]> {
  const token = obterToken();
  const response = await api.get<{ mensagens: Mensagem[] }>("/mensagens", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data.mensagens;
}

export async function buscarMensagemPorId(id: number): Promise<Mensagem> {
  const token = obterToken();
  const response = await api.get<{ mensagem: Mensagem }>(`/mensagens/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data.mensagem;
}

export async function excluirMensagem(id: number) {
  const token = obterToken();
  const response = await api.delete<{ message: string; mensagem: Mensagem }>(
    `/mensagens/${id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
}

export async function buscarConversa(idOutroUsuario: number): Promise<Mensagem[]> {
  const token = obterToken();
  const response = await api.get<{ mensagens: Mensagem[] }>(
    `/mensagens/conversa/${idOutroUsuario}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data.mensagens;
}

