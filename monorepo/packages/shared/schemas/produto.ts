import { z } from "zod";

export const produtoSchema = z.object({
    nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
    descricao: z.string().min(5, "A descrição está muito curta"),
    preco: z
        .union([z.string(), z.number()])
        .transform((val) => typeof val === "string" ? parseFloat(val) : val)
        .refine((val) => !isNaN(val) && val >= 0.01, {
            message: "Preço deve ser maior que zero"
        }),
    qtdEstoque: z
        .union([z.string(), z.number()])
        .transform((val) => typeof val === "string" ? parseInt(val) : val)
        .refine((val) => Number.isInteger(val) && val >= 1, {
            message: "Estoque mínimo de 1 unidade"
        }),
});

export const cadastroProdutoSchema = z.object({
    nomeProduto: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
    descricao: z.string().min(5, "A descrição está muito curta"),
    preco: z
        .union([z.string(), z.number()])
        .transform((val) => typeof val === "string" ? parseFloat(val) : val)
        .refine((val) => !isNaN(val) && val >= 0.01, {
            message: "Preço deve ser maior que zero"
        }),
    qtdEstoque: z
        .union([z.string(), z.number()])
        .transform((val) => typeof val === "string" ? parseInt(val) : val)
        .refine((val) => Number.isInteger(val) && val >= 1, {
            message: "Estoque mínimo de 1 unidade"
        }),
    tipo: z.enum([
        "",
        "ELETRONICOS",
        "MOVEIS",
        "ROUPA",
        "CALCADOS",
        "LIVRO",
        "AUTOMOVEIS",
        "OUTROS"
    ]).refine((val) => val !== "", {
        message: "Selecione uma categoria válida",
    }),
})