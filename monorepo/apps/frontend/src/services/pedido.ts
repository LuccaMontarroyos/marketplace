import api from "./api";

export async function criarPedido(metodoDePagamento: string, enderecoId: number, tipoEnvio: string) {
    try {
        const { data } = await api.post("/pedidos", {
            metodoDePagamento, enderecoId, tipoEnvio
        }, { withCredentials: true });
        return data;
    } catch (error) {
        console.error("Erro ao criar pedido: ", error);
        throw error;
    }
}