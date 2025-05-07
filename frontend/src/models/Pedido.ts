import { PedidoProduto } from "./PedidoProduto"
import { StatusPedido } from "./StatusPedido"

export interface Pedido {
  id: number
  usuarioId?: number
  sessionId?: string
  dataPedido: string
  status: StatusPedido
  produtos: PedidoProduto[]
}