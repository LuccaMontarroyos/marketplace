import { TipoProduto } from "./enums";

export interface Produto {
    id: number;
    nome: string;
    preco: number;
    qtdEstoque: number;
    idVendedor: number;
    imagens: File[];
    descricao: string;
    tipo: TipoProduto;
}

export interface CadastroDeProduto {
    nome: string;
    preco: number;
    qtdEstoque: number;
    idVendedor: number;
    imagens: File[];
    descricao: string;
    tipo: TipoProduto;
}

export type ImagemProduto = File | { id?: number; url: string; produtoId?: number };
