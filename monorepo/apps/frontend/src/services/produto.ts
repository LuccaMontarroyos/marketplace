import { obterToken } from "@/utils/token";
import api from "./api";
import { Produto } from "@/types/Produto";

export async function buscarProdutosDoUsuario () {
    const token = obterToken();
    const resposta = await api.get<Produto[]>("")
}