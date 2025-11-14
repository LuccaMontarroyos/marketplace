import { obterToken } from "@/utils/token";
import api from "./api";

export interface Avaliacao {
  id: number;
  idProduto: number;
  idUsuario: number;
  avaliacao: number;
  comentario: string | null;
  dataAvaliacao: Date;
  produto?: any;
  usuario?: {
    id: number;
    nome: string;
    email: string;
  };
}

export interface DadosAvaliacao {
  idProduto: number;
  avaliacao: number;
  comentario?: string;
}

export async function criarAvaliacao(dados: DadosAvaliacao) {
  const token = obterToken();
  const response = await api.post<{ message: string; avaliacao: Avaliacao }>(
    "/avaliacoes",
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

export async function buscarAvaliacoesPorProduto(
  idProduto: number
): Promise<Avaliacao[]> {
  const token = obterToken();
  const response = await api.get<{ avaliacoes: Avaliacao[] }>(
    `/avaliacoes/${idProduto}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data.avaliacoes;
}

export async function excluirAvaliacao(id: number) {
  const token = obterToken();
  const response = await api.delete<{ message: string; avaliacao: Avaliacao }>(
    `/avaliacoes/${id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
}

