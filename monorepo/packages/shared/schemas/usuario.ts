import { z } from "zod";

const usuarioSchema = z.object({
    nome: z.string().min(1, "Nome é obrigatório").regex(/^[^\d]*$/, "O nome não pode conter números"),
    email: z.string().email("Email inválido"),
    senha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
    confirmSenha: z.string(),
    celular: z
        .string()
        .min(10, "Celular inválido")
        .max(15, "Celular inválido")
        .regex(/^\(?\d{2}\)?[\s-]?\d{4,5}-?\d{4}$/, "Formato de celular inválido"),
    cpf: z
        .string()
        .length(11, "CPF deve conter 11 dígitos")
        .regex(/^\d{11}$/, "CPF deve conter apenas números"),
    imagem: z.any().optional(),
}).refine((data)=> data.senha === data.confirmSenha, {
    message: 'As senhas não coincidem',
    path: ["confirmSenha"],
}
);

type FormInputs = z.infer<typeof usuarioSchema>;
