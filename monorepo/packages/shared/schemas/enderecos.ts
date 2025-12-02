import { z } from 'zod';

const estadosBrasileiros = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

function normalize(text: string) {
  return text
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

  export const enderecoSchema = z.object({
    numero: z.string().min(1, { message: "O número é obrigatório." }),

    logradouro: z.string()
      .min(3, { message: "O logradouro deve ter pelo menos 3 caracteres." })
      .transform(normalize),

    cidade: z.string()
      .min(2, { message: "A cidade deve ter pelo menos 2 caracteres." })
      .transform(normalize),

    cep: z.string()
      .regex(/^\d{8}$/, { message: "CEP inválido" }),

    estado: z.string()
      .transform((val) => normalize(val).toUpperCase())
      .refine((val) => estadosBrasileiros.includes(val), {
        message: "Informe uma sigla de estado válida (ex: SP, RJ)."
      }),

    bairro: z.string()
      .min(3, { message: "O bairro deve ter pelo menos 3 caracteres." })
      .transform(normalize),

    complemento: z.string()
      .min(3, { message: "O complemento deve ter pelo menos 3 caracteres." })
      .transform(normalize)
      .optional(),

    pontoReferencia: z.string()
      .transform(normalize)
      .optional(),
  });
