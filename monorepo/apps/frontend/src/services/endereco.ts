import { obterToken } from "@/utils/token";
import api from "./api";
import { DadosAtualizacaoEndereco, DadosCadastroEndereco, Endereco } from "@/types/Endereco";

export async function buscarEnderecosDoUsuario () {
    const token = obterToken();
    const response = await api.get<Endereco[]>("/enderecos", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    return response.data;
}

export async function editarEnderecoDoUsuario (id: number, dados: DadosAtualizacaoEndereco) {
    const token = obterToken();
    const response = await api.put(`/enderecos/${id}`, dados, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        }
    })

    return response.data;
}

export async function cadastrarEndereco (dados: DadosCadastroEndereco) {
    const token = obterToken();
    const response = await api.post("/enderecos", dados, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        }
    });

    return response.data;
}

export async function excluirEndereco (id: number) {
    const token = obterToken();
    const response = await api.delete(`/enderecos/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    return response.data;
}