import { z } from 'zod';

export const enderecoSchema = z.object({
  numero: z.string(),
  logradouro: z.string().min(3),
  cidade: z.string().min(2),
  cep: z.string().length(8),
  estado: z.string().length(2),
  bairro: z.string().min(3),
  complemento: z.string().min(3).optional(),
  pontoReferencia: z.string().optional(),
});
