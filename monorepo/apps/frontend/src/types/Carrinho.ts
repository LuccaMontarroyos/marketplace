export interface ItemCarrinho {
    id: number;
    idProduto: number;
    quantidade: number;
    precoAtual: string;
    produto: {
        id: number;
        nome: string;
        descricao: string;
        preco: string;
        imagens: { id: number; url: string }[];
    };
}