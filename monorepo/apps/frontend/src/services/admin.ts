import { obterToken } from "@/utils/token";
import api from "./api";

export interface UsuarioAdmin {
  id: number;
  nome: string;
  email: string;
  cpf: string;
  celular: string;
  isVendedor: boolean;
  isAdmin: boolean;
  createdAt: Date;
  avaliacoes: any[];
  pedidos: any[];
  produtos: any[];
}

export async function buscarUsuarios(): Promise<UsuarioAdmin[]> {
  const token = obterToken();
  const response = await api.get<{ usuarios: UsuarioAdmin[] }>("/admin/usuarios", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data.usuarios;
}

export async function excluirUsuario(id: number) {
  const token = obterToken();
  const response = await api.delete(`/admin/usuarios/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}

