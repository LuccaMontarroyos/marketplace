import { Produto } from "./Produto"

export interface PedidoProduto {
    id: number
    idPedido: number
    idProduto: number
    quantidade: number
    precoUnitario: number
    produto?: Produto
}