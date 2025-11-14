import { obterToken } from "@/utils/token";
import api from "./api";

export interface Pedido {
  id: number;
  idComprador: number | null;
  sessionId: string | null;
  status: "PENDENTE" | "PAGO" | "ENVIADO" | "ENTREGUE";
  idEnderecoEntrega: number;
  dataEntregaEstimada: Date;
  createdAt: Date;
  PedidoProduto: Array<{
    id: number;
    idPedido: number;
    idProduto: number;
    quantidade: number;
    precoUnitario: number;
    produto: any;
  }>;
  Pagamento?: Array<{
    id: number;
    idPedido: number;
    valor: number;
    metodoPagamento: string;
    status: string;
  }>;
  comprador?: {
    id: number;
    nome: string;
    email: string;
  };
}

export async function criarPedido(
  metodoPagamento: string,
  idEndereco: number,
  tipoEnvio: string
) {
  const token = obterToken();
  const { data } = await api.post(
    "/pedidos",
    {
      metodoPagamento,
      idEndereco,
      tipoEnvio,
    },
    {
      withCredentials: true,
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    }
  );
  return data;
}

export async function buscarPedidosDoComprador(): Promise<Pedido[]> {
  const token = obterToken();
  const response = await api.get<Pedido[]>("/pedidos/comprador", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}

export async function buscarPedidosDoVendedor(): Promise<Pedido[]> {
  const token = obterToken();
  const response = await api.get<Pedido[]>("/pedidos/vendedor", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}

export async function buscarPedidoPorId(id: number): Promise<Pedido> {
  const token = obterToken();
  const response = await api.get<Pedido>(`/pedidos/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}

export async function refazerPedido(idPedido: number) {
  const token = obterToken();
  const response = await api.post(
    "/pedidos/refazer",
    { idPedido },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
}

export async function cancelarPedido(id: number) {
  const token = obterToken();
  const response = await api.delete(`/pedidos/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}

export async function atualizarStatusPedido(id: number, statusPedido: string) {
  const token = obterToken();
  const response = await api.put(
    `/pedidos/${id}`,
    { statusPedido },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
}