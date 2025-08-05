import { TipoProduto } from "./enums";

export interface Produto {
    id: number;
    nome: string;
    preco: number;
    estoque: number;
    idVendedor: number;
    imagens: string[];
    descricao: string;
    tipo: TipoProduto;
}

export interface CadastroDeProduto {
    nome: string;
    preco: string;
    qtdEstoque: number;
    idVendedor: number;
    imagens: string[];
    descricao: string;
    tipo: TipoProduto;
}