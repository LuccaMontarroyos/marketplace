import { z } from "zod";

export const produtoSchema = z.object({
    nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
    descricao: z.string().min(5, "A descrição está muito curta"),
    preco: z.number().min(0.01, "Preço deve ser maior que zero"),
    qtdEstoque: z.number().int().min(1, "Estoque mínimo de 1 unidade"),
    //   imagens: z.array(z.string().refine(val => val.startsWith('http') || val.startsWith('blob:'), {
    //   message: 'URL da imagem inválida',
    // })).max(6),

});

export const cadastroProdutoSchema = z.object({
    nomeProduto: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
    descricao: z.string().min(5, "A descrição está muito curta"),
    preco: z.number().min(0.01, "Preço deve ser maior que zero"),
    qtdEstoque: z.number().int().min(1, "Estoque mínimo de 1 unidade"),
    tipo: z.enum([
        "ELETRONICOS",
        "MOVEIS",
        "ROUPA",
        "CALCADOS",
        "LIVRO",
        "AUTOMOVEIS",
        "OUTROS"
    ], {required_error: "Selecione uma categoria para o produto"}),
    imagem: z.string()
})