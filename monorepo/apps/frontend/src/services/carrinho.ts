import { ItemCarrinho } from "@/types/Carrinho";
import api from "./api";

export async function buscarProdutosDoCarrinho(): Promise<ItemCarrinho[]> {
    try {
        const { data } = await api.get<ItemCarrinho[]>("/carrinho", {
            withCredentials: true
        });
        return data;
    } catch (error) {
        console.error("Erro ao buscar itens do carrinho:", error);
        return [];
    }
};

export async function adicionarAoCarrinho(idProduto: number, quantidade: number) {
    try {
        const { data } = await api.post("/carrinho", {
            idProduto, quantidade
        }, {
            withCredentials: true,
        })
        return data;
    } catch (error) {
        console.error("Erro ao adicionar produto ao carrinho: ", error);
        throw error;
    }
}

export async function atualizarCarrinho(idProduto: number, quantidade: number) {
    try {
        const { data } = await api.patch("/carrinho", {
            idProduto, quantidade
        }, { withCredentials: true });
        return data;
    } catch (error) {
        console.error("Erro ao atualizar carrinho: ", error);
        throw error;
    }
}

export async function removerProdutoDoCarrinho(idProduto: number) {
    try {
        const { data } = await api.delete(`/carrinho/${idProduto}`, {
            withCredentials: true
        });
        return data;
    } catch (error) {
        console.error("Erro ao remover produto do carrinho: ", error);
        throw error;
    }
}  