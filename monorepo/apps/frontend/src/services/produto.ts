import { obterToken } from "@/utils/token";
import api from "./api";
import { Produto } from "@/types/Produto";

export async function buscarProdutosDoUsuario(): Promise<Produto[]> {
    const token = obterToken();
    const resposta = await api.get<Produto[]>("/produtos/usuario", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return resposta.data;
}

export async function cadastrarProduto(formData: FormData) {
    const token = obterToken();
    const resposta = await api.post("/produtos", formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
        }
    });

    return resposta.data;
}

export async function atualizarProduto(formData: FormData, id: number) {
    const token = obterToken();
    const resposta = await api.put(`produtos/${id}`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
        }
    });

    return resposta.data;
}

export async function excluirProduto(id: number) {
    const token = obterToken();
    const resposta = await api.delete(`produtos/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
        }
    })

    return resposta.data;
}