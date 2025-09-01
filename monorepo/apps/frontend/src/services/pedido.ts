import api from "./api";

export async function criarPedido(metodoPagamento: string, idEndereco: number, tipoEnvio: string) {
    try {
        const { data } = await api.post("/pedidos", {
            metodoPagamento, idEndereco, tipoEnvio
        }, { withCredentials: true });
        return data;
    } catch (error) {
        console.error("Erro ao criar pedido: ", error);
        throw error;
    }
}