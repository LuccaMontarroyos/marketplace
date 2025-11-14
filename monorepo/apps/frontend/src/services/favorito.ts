import { obterToken } from "@/utils/token";
import api from "./api";

export interface Favorito {
  id: number;
  idUsuario: number;
  idProduto: number;
  produto: any;
}

export async function adicionarFavorito(idProduto: number) {
  const token = obterToken();
  const response = await api.post<{ message: string; favorito: Favorito }>(
    "/favoritos",
    { idProduto },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
}

export async function buscarFavoritos(): Promise<Favorito[]> {
  const token = obterToken();
  const response = await api.get<{ message: string; favoritos: Favorito[] }>(
    "/favoritos",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data.favoritos;
}

export async function removerFavorito(idProduto: number) {
  const token = obterToken();
  const response = await api.delete<{ message: string }>(
    `/favoritos/${idProduto}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
}

